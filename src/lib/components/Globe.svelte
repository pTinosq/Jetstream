<script lang="ts">
  import { onMount } from 'svelte';
  import { feature } from 'topojson-client';
  import type { Topology, GeometryCollection } from 'topojson-specification';
  import type { Feature, Geometry } from 'geojson';
  import worldTopo from 'world-atlas/countries-110m.json';
  import type { GlobeData, GlobePoint, GlobeArc } from '$lib/globe/types';

  let { data }: { data: GlobeData } = $props();
  let container: HTMLDivElement | undefined;

  // Faint landmasses, resolved once from the bundled world atlas (offline).
  const topology = worldTopo as unknown as Topology<{ countries: GeometryCollection }>;
  const countries: Feature<Geometry>[] = feature(topology, topology.objects.countries).features;

  onMount(() => {
    let destroy: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const Globe = (await import('globe.gl')).default;
      if (cancelled || container === undefined) return;

      const world = new Globe(container)
        .backgroundColor('rgba(0,0,0,0)')
        .showGlobe(true)
        .showGraticules(true)
        .showAtmosphere(true)
        .atmosphereColor('#cfe0ff')
        .atmosphereAltitude(0.08)
        .polygonsData(countries)
        .polygonCapColor(() => 'rgba(16,22,32,0.05)')
        .polygonSideColor(() => 'rgba(0,0,0,0)')
        .polygonStrokeColor(() => 'rgba(47,95,224,0.22)')
        .polygonAltitude(0.006)
        .pointsData(data.points)
        .pointLat('lat')
        .pointLng('lng')
        .pointColor(() => '#2f5fe0')
        .pointAltitude(0.01)
        .pointRadius(0.24)
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
        .arcColor(() => ['rgba(47,95,224,0.9)', 'rgba(120,160,255,0.5)'])
        .arcStroke(0.42)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(2400)
        .arcAltitudeAutoScale(0.42)
        .arcLabel((d: object) => (d as GlobeArc).label);

      // Pale sphere so the faint land and accent routes read on a light page.
      (world.globeMaterial() as { color: { set: (c: string) => void } }).color.set('#eef2f9');

      const fit = (): void => {
        if (container === undefined) return;
        world.width(container.clientWidth).height(container.clientHeight);
      };
      fit();
      world.pointOfView({ lat: 25, lng: 10, altitude: 2.4 });

      // three's OrbitControls types aren't resolvable through globe.gl's d.ts.
      const controls = world.controls() as { autoRotate: boolean; autoRotateSpeed: number };
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.35;

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

<div bind:this={container} class="h-full w-full"></div>
