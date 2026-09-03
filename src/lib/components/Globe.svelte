<script lang="ts">
  import { onMount } from 'svelte';
  import type { GlobeData, GlobePoint, GlobeArc } from '$lib/globe/types';

  let { data }: { data: GlobeData } = $props();
  let container: HTMLDivElement | undefined;

  onMount(() => {
    let destroy: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const Globe = (await import('globe.gl')).default;
      if (cancelled || container === undefined) return;

      const world = new Globe(container)
        .globeImageUrl('/earth-night.jpg')
        .backgroundColor('#020617')
        .atmosphereColor('#38bdf8')
        .pointsData(data.points)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor(() => '#38bdf8')
        .pointAltitude(0.01)
        .pointRadius(0.28)
        .pointLabel((d: object) => {
          const point = d as GlobePoint;
          const code = point.iata ?? '';
          return `${code} ${point.name} — ${point.visits} visit${point.visits === 1 ? '' : 's'}`;
        })
        .arcsData(data.arcs)
        .arcStartLat('startLat')
        .arcStartLng('startLng')
        .arcEndLat('endLat')
        .arcEndLng('endLng')
        .arcColor(() => ['#38bdf8', '#818cf8'])
        .arcStroke(0.5)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2200)
        .arcLabel((d: object) => (d as GlobeArc).label);

      const fit = (): void => {
        if (container === undefined) return;
        world.width(container.clientWidth).height(container.clientHeight);
      };
      fit();
      world.pointOfView({ lat: 25, lng: 10, altitude: 2.2 });

      // three's OrbitControls types aren't resolvable through globe.gl's
      // d.ts, so narrow to just the fields we set.
      const controls = world.controls() as { autoRotate: boolean; autoRotateSpeed: number };
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;

      window.addEventListener('resize', fit);
      destroy = () => {
        window.removeEventListener('resize', fit);
        world._destructor();
      };
    })();

    return () => {
      cancelled = true;
      destroy?.();
    };
  });
</script>

<div bind:this={container} class="h-[70vh] w-full rounded-xl"></div>
