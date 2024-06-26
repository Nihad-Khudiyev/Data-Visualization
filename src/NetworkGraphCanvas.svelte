<script>
  import { onMount } from "svelte";
  import { scaleLinear, scaleOrdinal } from "d3-scale";
  import { zoom, zoomIdentity } from "d3-zoom";
  import { schemeCategory10 } from "d3-scale-chromatic";
  import { select, selectAll, pointer } from "d3-selection";
  import { drag } from "d3-drag";
  import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
  } from "d3-force";

  const legendItems = [
    { label: "Countries", color: "#006400" },
    { label: "Distribution Centers", color: "#FFD700" },
    { label: "Production Plants", color: "#01abfc" },
    { label: "Material", color: "#800080" },
    { label: "Customers", color: "#7A17F6" }
  ];

  let d3 = {  
    zoom,
    zoomIdentity,
    scaleLinear,
    scaleOrdinal,
    schemeCategory10,
    select,
    selectAll,
    pointer,
    drag,
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
  };

  export let graph;

  let canvas;
  let width = 500;
  let height = 600;
  let max = 100;
  const nodeRadius = 5;
  let activeNode = false;
  const padding = { top: 20, right: 40, bottom: 40, left: 25 };

  $: xScale = scaleLinear()
    .domain([0, 20])
    .range([padding.left, width - padding.right]);

  $: yScale = scaleLinear()
    .domain([0, 12])
    .range([height - padding.bottom, padding.top]);

  $: xTicks = width > 180 ? [0, 4, 8, 12, 16, 20] : [0, 10, 20];

  $: yTicks = height > 180 ? [0, 2, 4, 6, 8, 10, 12] : [0, 4, 8, 12];

  $: d3yScale = scaleLinear().domain([0, height]).range([height, 0]);

  $: links = graph.links.map((d) => Object.create(d));
  $: nodes = graph.nodes.map((d) => {
    d.size = Math.pow(graph.links
      .filter((link) => link.source == d.id || link.target == d.id)
      .map((link) => link.value)
      .reduce((a, b) => a + b), 2);
    if (d.id == "You") {
      max = d.size;
      d.details.messages = max;
    }
    return Object.create(d);
  });

  function groupColour(context, d) {
    let nodesize = 2 + Math.sqrt(d.size) / 5;
    let radgrad = context.createRadialGradient(
      d.x,
      d.y,
      nodesize / 3,
      d.x,
      d.y,
      nodesize
    );
    radgrad.addColorStop(0, "#01abfc");
    radgrad.addColorStop(0.1, "#01abfc");
    radgrad.addColorStop(1, "#01abfc00");

    let radgrad2 = context.createRadialGradient(
      d.x,
      d.y,
      nodesize / 3,
      d.x,
      d.y,
      nodesize
    );
    radgrad2.addColorStop(0, "#7A17F6");
    radgrad2.addColorStop(0.1, "#7A17F6");
    radgrad2.addColorStop(1, "#7A17F600");

    let radgrad3 = context.createRadialGradient(
      d.x,
      d.y,
      nodesize / 3,
      d.x,
      d.y,
      nodesize
    );
    radgrad3.addColorStop(0, "#006400");
    radgrad3.addColorStop(0.1, "#006400");
    radgrad3.addColorStop(1, "#00FF0000");

    let radgrad4 = context.createRadialGradient(
      d.x,
      d.y,
      nodesize / 3,
      d.x,
      d.y,
      nodesize
    );
    radgrad4.addColorStop(0, "#FFD700");
    radgrad4.addColorStop(0.1, "#FFD700");
    radgrad4.addColorStop(1, "#FFD70000");

    let radgrad5 = context.createRadialGradient(
      d.x,
      d.y,
      nodesize / 3,
      d.x,
      d.y,
      nodesize
    );
    radgrad5.addColorStop(0, "#800080");
    radgrad5.addColorStop(0.1, "#800080");
    radgrad5.addColorStop(1, "#80008000");
    let radgrads = [radgrad, radgrad2, radgrad3, radgrad4, radgrad5];
    return radgrads[d.group % 5];
  }
  let showCard;
  let transform = d3.zoomIdentity;
  let simulation, context;
  let dpi = 1;
  onMount(() => {
    dpi = window.devicePixelRatio || 1;
    context = canvas.getContext("2d");
    resize();
    fitToWindow(canvas);

    window.addEventListener("resize", () => {
        fitToWindow(canvas);
        simulationUpdate();
    });

    simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(
            (d) => 2 + Math.sqrt(max) / 4 + 130 * Math.pow(2, -d.value / 1000)
          )
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => Math.sqrt(d.size)/4))
      .on("tick", simulationUpdate);

    // title
    d3.select(context.canvas).on("mousemove", (event) => {
      const d = simulation.find(
        transform.invertX(event.offsetX * dpi),
        transform.invertY(event.offsetY * dpi),
        50
      );

      if (d) activeNode = d;
      else activeNode = false;
    });

    d3.select(context.canvas).on("click", () => {
      if (activeNode) {
        showCard = JSON.parse(
          JSON.stringify({ id: activeNode.id, details: activeNode.details })
        );
      }
    });

    d3.select(canvas)
      .call(
        d3
          .drag()
          .container(canvas)
          .subject(dragsubject)
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
      )
      .call(
        d3
          .zoom()
          .scaleExtent([1 / 10, 8])
          .on("zoom", zoomed)
      );
  });

  function simulationUpdate() {
    context.save();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    links.forEach((d) => {
      context.beginPath();
      context.moveTo(d.source.x, d.source.y);
      context.lineTo(d.target.x, d.target.y);
      context.globalAlpha = 0.3;
      context.strokeStyle = "#999";
      context.lineWidth = Math.cbrt(d.value) / 2;
      context.stroke();
      context.globalAlpha = 1;
    });

    nodes.forEach((d, i) => {
      context.beginPath();
      context.arc(d.x, d.y, 2 + Math.sqrt(d.size) / 5, 0, 2 * Math.PI);
      context.strokeStyle = "transparent";
      context.lineWidth = 1.5;
      context.stroke();
      context.fillStyle = groupColour(context, d);
      context.fill();
      if (d.size > max / 50) {
        context.fillStyle = "white";
        d.id
          .split(/(?=[A-Z])/)
          .forEach((word, index) =>
            context.fillText(word, d.x - 10, d.y + 10 * index)
          );
      }
    });
    context.restore();
  }

  function zoomed(currentEvent) {
    transform = currentEvent.transform;
    simulationUpdate();
  }

  // Use the d3-force simulation to locate the node
  function dragsubject(currentEvent) {
    const node = simulation.find(
      transform.invertX(currentEvent.x * dpi),
      transform.invertY(currentEvent.y * dpi),
      50
    );
    if (node) {
      node.x = transform.applyX(node.x);
      node.y = transform.applyY(node.y);
    }
    return node;
  }

  function dragstarted(currentEvent) {
    if (!currentEvent.active) simulation.alphaTarget(0.3).restart();
    currentEvent.subject.fx = transform.invertX(currentEvent.subject.x);
    currentEvent.subject.fy = transform.invertY(currentEvent.subject.y);
  }

  function dragged(currentEvent) {
    currentEvent.subject.fx = transform.invertX(currentEvent.x);
    currentEvent.subject.fy = transform.invertY(currentEvent.y);
  }

  function dragended(currentEvent) {
    if (!currentEvent.active) simulation.alphaTarget(0);
    currentEvent.subject.fx = null;
    currentEvent.subject.fy = null;
  }

  function resize() {
    ({ width, height } = canvas);
  }

  function fitToWindow(canvas) {
    const dpi = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    canvas.width = screenWidth * dpi;
    canvas.height = screenHeight * dpi;

    // Set CSS width and height to fill the entire window
    canvas.style.width = screenWidth + "px";
    canvas.style.height = screenHeight + "px";

    // Update width and height variables
    width = screenWidth * dpi;
    height = screenHeight * dpi;
  }
</script>

<h2 style="color:white">Mapping Customer Relations Network</h2>
<svelte:window on:resize={resize} />

<div class="chart-container">
  <div class="legend">
    {#each legendItems as item}
      <div class="legend-item">
        <div class="legend-color" style="background-color: {item.color}"></div>
        <div class="legend-label">{item.label}</div>
      </div>
    {/each}
  </div>
  {#if activeNode}
    <breadcrumb id="nodeDetails">
      <strong>{activeNode.id.split(/(?=[A-Z])/).join(' ')}</strong>
      <br />
      {#if activeNode.details}
        {#each Object.entries(activeNode.details) as detail}
          {detail[0]}:
          {detail[1]}
          <br />
        {/each}
      {/if}
    </breadcrumb>
  {/if}
  <canvas bind:this={canvas} />
</div>

<style>
  :global(body){background-color: #000}
  .chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 70vh; /* Adjust the height as needed */
  }
  canvas {
    float: right;
  }
  #nodeDetails {
    position: absolute;
    top: 1%;
    left: 1%;
    width: unset;
    color: #eee;
  }

  .legend {
    position: absolute;
    top: 7%;
    right: 4%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .legend-item {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }

  .legend-color {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .legend-label {
    color: #eee;
  }
  
</style>
