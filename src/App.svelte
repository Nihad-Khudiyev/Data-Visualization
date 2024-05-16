<script>
	import NetworkGraph from './NetworkGraphCanvas.svelte';
	import data from './data.js';
	console.log(data)
</script>

<style>
	.chart {
		width: 100%;
		max-width: 640px;
		height: calc(100% - 4em);
		min-height: 280px;
		max-height: 480px;
		margin: 0 auto;
	}
</style>

<div class="chart">
	<NetworkGraph graph={data}/>
</div>