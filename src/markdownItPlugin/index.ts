export default function(context: { contentScriptId: string }) {
	return {
		plugin: function(_markdownIt: any, _pluginOptions: any) {
			// No markdown-it rule modifications needed.
			// All work is done by the viewer JS asset.
		},
		assets: function() {
			return [
				{ name: './todoStatus.js' },
				{ name: './todoStatus.css' },
			];
		},
	};
}
