export interface SpatialNodePack {
  inputNode: AudioNode;
  outputNode: AudioNode;
  updatePosition: (lat: number, lon: number) => void;
  dispose: () => void;
}

export class SpatialAudioBuilder {
  /**
   * Creates a spatial routing chain based on the chosen mode.
   * mode: 'spatial-hrtf' or 'stereo-panning'
   */
  public static createSpatialChain(
    ctx: AudioContext,
    destination: AudioNode,
    lat: number,
    lon: number,
    mode: 'spatial-hrtf' | 'stereo-panning'
  ): SpatialNodePack {
    const inputGain = ctx.createGain();

    // Subtle latitude elevation filter: Northern hemisphere enhances crisp presence, Southern gives warmer depth
    const elevationFilter = ctx.createBiquadFilter();
    elevationFilter.type = 'peaking';
    elevationFilter.frequency.setValueAtTime(3200, ctx.currentTime);
    const latTilt = Math.max(-1, Math.min(1, lat / 90));
    elevationFilter.gain.setValueAtTime(latTilt * 3.0, ctx.currentTime);
    elevationFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    inputGain.connect(elevationFilter);

    if (mode === 'spatial-hrtf' && typeof ctx.createPanner === 'function') {
      try {
        const panner = ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;

        // Convert lat/lon in degrees to spherical 3D coordinates
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const radius = 2.5;

        const x = -radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.cos(theta);

        if (panner.positionX) {
          panner.positionX.setValueAtTime(x, ctx.currentTime);
          panner.positionY.setValueAtTime(y, ctx.currentTime);
          panner.positionZ.setValueAtTime(z, ctx.currentTime);
        } else {
          panner.setPosition(x, y, z);
        }

        elevationFilter.connect(panner);
        panner.connect(destination);

        return {
          inputNode: inputGain,
          outputNode: panner,
          updatePosition: (newLat: number, newLon: number) => {
            const p = (90 - newLat) * (Math.PI / 180);
            const t = (newLon + 180) * (Math.PI / 180);
            const nx = -radius * Math.sin(p) * Math.sin(t);
            const ny = radius * Math.cos(p);
            const nz = radius * Math.sin(p) * Math.cos(t);
            if (panner.positionX) {
              panner.positionX.setTargetAtTime(nx, ctx.currentTime, 0.05);
              panner.positionY.setTargetAtTime(ny, ctx.currentTime, 0.05);
              panner.positionZ.setTargetAtTime(nz, ctx.currentTime, 0.05);
            } else {
              panner.setPosition(nx, ny, nz);
            }
          },
          dispose: () => {
            panner.disconnect();
            elevationFilter.disconnect();
            inputGain.disconnect();
          },
        };
      } catch (e) {
        console.warn('HRTF Panner initialization error, falling back to StereoPanner:', e);
      }
    }

    // Standard Stereo Panning fallback
    let stereoNode: AudioNode;
    let setPan = (_p: number) => {};

    if (typeof ctx.createStereoPanner === 'function') {
      const stereoPanner = ctx.createStereoPanner();
      const panVal = Math.max(-1, Math.min(1, lon / 180));
      stereoPanner.pan.setValueAtTime(panVal, ctx.currentTime);
      stereoNode = stereoPanner;
      setPan = (p: number) => {
        stereoPanner.pan.setTargetAtTime(p, ctx.currentTime, 0.05);
      };
    } else {
      // Fallback gain splitter if StereoPannerNode not supported
      const gainLeft = ctx.createGain();
      const gainRight = ctx.createGain();
      const merger = ctx.createChannelMerger(2);
      const panVal = Math.max(-1, Math.min(1, lon / 180));
      gainLeft.gain.setValueAtTime(0.5 * (1 - panVal), ctx.currentTime);
      gainRight.gain.setValueAtTime(0.5 * (1 + panVal), ctx.currentTime);
      elevationFilter.connect(gainLeft);
      elevationFilter.connect(gainRight);
      gainLeft.connect(merger, 0, 0);
      gainRight.connect(merger, 0, 1);
      stereoNode = merger;
      setPan = (p: number) => {
        gainLeft.gain.setTargetAtTime(0.5 * (1 - p), ctx.currentTime, 0.05);
        gainRight.gain.setTargetAtTime(0.5 * (1 + p), ctx.currentTime, 0.05);
      };
    }

    elevationFilter.connect(stereoNode);
    stereoNode.connect(destination);

    return {
      inputNode: inputGain,
      outputNode: stereoNode,
      updatePosition: (_newLat: number, newLon: number) => {
        const pan = Math.max(-1, Math.min(1, newLon / 180));
        setPan(pan);
      },
      dispose: () => {
        stereoNode.disconnect();
        elevationFilter.disconnect();
        inputGain.disconnect();
      },
    };
  }
}
