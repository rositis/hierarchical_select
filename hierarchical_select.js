// $Id$

var HierarchicalSelect = HierarchicalSelect || {};

HierarchicalSelect.context = function() {
	var $context;
	
	if (undefined === $context) {
		$context = $("form div.form-item");
	}
	return $context;
};

HierarchicalSelect.initialize = function() {
	var hsid;
	var initial;

	for (hsid in Drupal.settings.hierarchical_select.settings) {
		initial = Drupal.settings.hierarchical_select.settings[hsid].initial;

		$('select.hierarchical-select-' + hsid, HierarchicalSelect.context)
		// Hide the standard select.
		.hide(0)
		// Add a unique div after the standard select.
		.after('<div id="hierarchical-select-'+ hsid +'-container" class="hierarchical-select-container clear-block"></div>');

		// Now load the initial HTML *without* using AHAH.
		$('div#hierarchical-select-'+ hsid +'-container', HierarchicalSelect.context)
		.html(initial);
	}

	HierarchicalSelect.attachBindings();		
}

HierarchicalSelect.attachBindings = function() {
	var hsid;
	var updateFunction;

	for (hsid in Drupal.settings.hierarchical_select.settings) {
		// Closure.
		updateFunction = function(x) {  
			return function() { HierarchicalSelect.update(x, $(this).val()) };
		}(hsid);

		$('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context)
		.unbind()
		.change(updateFunction);
	}
}

HierarchicalSelect.update = function(hsid, selection) {
	var url = Drupal.settings.hierarchical_select.url;
	var lastUnchanged;
	var post = new Object();
	var $selects = $('select.hierarchical-select-'+ hsid + '-hierarchical-select', HierarchicalSelect.context);
	
	lastUnchanged = $selects.index($('select.hierarchical-select-'+ hsid +'-hierarchical-select option[@value='+ selection +']', HierarchicalSelect.context).parent()[0])

	// Drop out the *original* selects of the levels deeper than the select of
	// the level that just changed.
	$selects.gt(lastUnchanged).DropOutLeft(400);

	// Create the POST object.
	post['hsid'] = hsid;
	post['selection'] = selection;
	post['module'] = Drupal.settings.hierarchical_select.settings[hsid].module;
	for (param in Drupal.settings.hierarchical_select.settings[hsid].params) {
		post[param] = Drupal.settings.hierarchical_select.settings[hsid].params[param];
	}

	// Load the HTML.
	$('div#hierarchical-select-'+ hsid +'-container', HierarchicalSelect.context)
	.load(url, post, function() {
		$selects = $('select.hierarchical-select-'+ hsid + '-hierarchical-select', HierarchicalSelect.context);

		// Hide the loaded selects after the one that was just changed, then  drop
		// them in.
		$selects.gt(lastUnchanged).hide(0).DropInLeft(400);

		// Re-attach bindings.
		HierarchicalSelect.attachBindings();

		// Update the original select. Set it to the value of the "deepest" select
		// that we just loaded.
		$('select.hierarchical-select-'+ hsid, HierarchicalSelect.context).val(
			$selects.eq($selects.length - 1).val()
		);
	});
}

if (Drupal.jsEnabled) {
	$(document).ready(function() {
		HierarchicalSelect.initialize();
	});
}
