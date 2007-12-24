// $Id$

var HierarchicalSelect = HierarchicalSelect || {};

HierarchicalSelect.context = function() {
  var $context;
  
  if (undefined === $context) {
    $context = $("form div.form-item");
  }
  return $context;
};

HierarchicalSelect.updateOriginalSelect = function(hsid) {
  saveLineage = Drupal.settings.hierarchical_select.settings[hsid].saveLineage;

  $selects = $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context);
  if (!saveLineage) {
    // Set it to the value of the "deepest" of the hierarchical selects.
    $('select.hierarchical-select-'+ hsid, HierarchicalSelect.context).val(
      $selects.eq($selects.length - 1).val()
    );
  }
  else {
    // First reset the current selection (unselect the selected options).
    $('select.hierarchical-select-'+ hsid, HierarchicalSelect.context)
    .children()
    .removeAttr('selected');

    // Select each hierarchical select's selected option in the original
    // select (thus effectively saving the term lineage).
    $selects
    .each(function() { // Can be done cleaner in jQuery 1.2, because .val() can then accept an array.
      $('select.hierarchical-select-'+ hsid, HierarchicalSelect.context)
      .find('option[@value='+ $(this).val() +']')
      .attr('selected', 'selected');
    });
  }
};

HierarchicalSelect.initialize = function() {
  var hsid;
  var initial;
  var $selects;

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

    HierarchicalSelect.updateOriginalSelect(hsid);
  }

  HierarchicalSelect.attachBindings();    
};

HierarchicalSelect.attachBindings = function() {
  var hsid;
  var updateFunction;

  for (hsid in Drupal.settings.hierarchical_select.settings) {
    // Closure.
    updateFunction = function(x) {
      return function() { HierarchicalSelect.update(x, $(this).val()); };
    }(hsid);

    $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context)
    .unbind()
    .change(updateFunction);
  }
};

HierarchicalSelect.update = function(hsid, selection) {
  var url = Drupal.settings.hierarchical_select.url;
  var saveLineage = Drupal.settings.hierarchical_select.settings[hsid].saveLineage;
  var lastUnchanged;
  var post = new Object();
  var $selects = $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context);
  lastUnchanged = $selects.index($('select.hierarchical-select-'+ hsid +'-hierarchical-select option[@value='+ selection +']', HierarchicalSelect.context).parent()[0]);

  if (saveLineage) {
    var lineageSelection = new Array();
    for (var level = 0; level < $selects.size(); level++) {
      var s = $('select#hierarchical-select-'+ hsid +'-level-'+ level, HierarchicalSelect.context).val();
      lineageSelection[level] = s;
      if (s == selection) {
        // Don't go collect values from levels deeper than the clicked level,
        // they have to be tossed away anyway.
        break;
      }
    }
  }

  // Drop out the *original* selects of the levels deeper than the select of
  // the level that just changed.
  $selects.gt(lastUnchanged).DropOutLeft(400);

  // Create the POST object.
  post['hsid'] = hsid;
  if (undefined === lineageSelection) {
    post['selection'] = selection;
  }
  else {
    post['selection'] = lineageSelection.join('|');
  }
  post['module'] = Drupal.settings.hierarchical_select.settings[hsid].module;
  post['required'] = Drupal.settings.hierarchical_select.settings[hsid].required;
  post['save_lineage'] = Drupal.settings.hierarchical_select.settings[hsid].saveLineage;
  post['enforce_deepest'] = Drupal.settings.hierarchical_select.settings[hsid].enforceDeepest;
  post['level_labels'] = Drupal.settings.hierarchical_select.settings[hsid].levelLabels;
  $.extend(post, Drupal.settings.hierarchical_select.settings[hsid].params);

  // Load the HTML.
  $('div#hierarchical-select-'+ hsid +'-container', HierarchicalSelect.context)
  .load(url, post, function() {
    $selects = $('select.hierarchical-select-'+ hsid + '-hierarchical-select', HierarchicalSelect.context);

    // Hide the loaded selects after the one that was just changed, then  drop
    // them in.
    $selects.gt(lastUnchanged).hide(0).DropInLeft(400);

    // Re-attach bindings.
    HierarchicalSelect.attachBindings();

    if (selection == 'none') {
      // Reset the original select.
      $('select.hierarchical-select-'+ hsid, HierarchicalSelect.context).val(0);
    }
    else {
      // Update the original select.
      HierarchicalSelect.updateOriginalSelect(hsid);
    }
  });
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    HierarchicalSelect.initialize();
  });
}
