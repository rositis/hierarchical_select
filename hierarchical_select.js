// $Id$

var HierarchicalSelect = HierarchicalSelect || {};

HierarchicalSelect.dropboxContent = new Array();

HierarchicalSelect.context = function() {
  return $("form div.form-item");
};

HierarchicalSelect.updateOriginalSelect = function(hsid) {
  var saveLineage = Drupal.settings.hierarchical_select.settings[hsid].saveLineage;
  var multiple = Drupal.settings.hierarchical_select.settings[hsid].multiple;
  var $selects = $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context);

  // Update it to the current selection.
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

  // If multiple select is enabled, also add the selections in the dropbox.
  if (multiple) {
    for (var i = 0; i < HierarchicalSelect.dropboxContent[hsid].length; i++) {
      for (var j = 0; j < HierarchicalSelect.dropboxContent[hsid][i].length; j++) {
        $('select.hierarchical-select-'+ hsid, HierarchicalSelect.context)
        .find('option[@value='+ HierarchicalSelect.dropboxContent[hsid][i][j] +']')
        .attr('selected', 'selected');
      }
    }
  }
};

HierarchicalSelect.initialize = function() {
  var container;
  var hsid;
  var initial;
  var multiple;
  var $selects;

  for (hsid in Drupal.settings.hierarchical_select.settings) {
    initial = Drupal.settings.hierarchical_select.settings[hsid].initial;
    multiple = Drupal.settings.hierarchical_select.settings[hsid].multiple;
    initialDropboxLineagesSelections = Drupal.settings.hierarchical_select.settings[hsid].initialDropboxLineagesSelections;

    // If multiple select is enabled, intialize the dropbox array.
    if (multiple) {
      HierarchicalSelect.dropboxContent[hsid] = initialDropboxLineagesSelections;
    }

    // Create the unique container.
    container = '<div id="hierarchical-select-'+ hsid +'-container" class="hierarchical-select-container clear-block" />';

    $('select.hierarchical-select-'+ hsid, HierarchicalSelect.context)
    // Hide the standard select.
    .hide(0)
    // Add a unique container div after the standard select.
    .after(container);

    // Now load the initial HTML *without* using AHAH.
    $('div#hierarchical-select-'+ hsid +'-container', HierarchicalSelect.context)
    .html(initial);

    HierarchicalSelect.updateOriginalSelect(hsid);
    HierarchicalSelect.attachBindings(hsid);
  }
};

HierarchicalSelect.attachBindings = function(hsid) {
  var addButton;
  var updateFunction;
  var addFunction;
  var multiple = Drupal.settings.hierarchical_select.settings[hsid].multiple;

  // Closure.
  updateFunction = function(x) {
    return function() { HierarchicalSelect.update(x, $(this).val()); };
  }(hsid);

  // Attach the event to every select of the current Hierarchical Select.
  $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context)
  .unbind()
  .change(updateFunction);

  // If multiple select is enabled, add an "Add" button to update the
  // dropbox and reset the selection.
  if (multiple) {
    addButton = Drupal.settings.hierarchical_select.settings[hsid].addButton;

    // Add the "Add" button.
    $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-input', HierarchicalSelect.context)
    .append(addButton);

    // Closure.
    addFunction = function(y) {
      return function() { HierarchicalSelect.add(y); };
    }(hsid);
    
    // Attach the event to the "Add" button.
    $('#hierarchical-select-'+ hsid +'-add-to-dropbox', HierarchicalSelect.context)
    .unbind()
    .click(addFunction);
  }
};

HierarchicalSelect.getFullSelection = function(hsid, selection) {
  var fullSelection;
  var $selects = $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context);
  var saveLineage = Drupal.settings.hierarchical_select.settings[hsid].saveLineage;

  // Make sure selection is always an array.
  if ("string" == typeof(selection)) {
    selection = new Array(selection);
  }

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

  if (undefined === lineageSelection) {
    fullSelection = selection;
  }
  else {
    fullSelection = lineageSelection;
  }

  return fullSelection;
};

HierarchicalSelect.post = function(hsid, fullSelection) {
  var post = new Object();
  post['hsid'] = hsid;
  if (typeof(fullSelection) == "string") {
    post['selection'] = fullSelection;
  }
  else {
    post['selection'] = fullSelection.join('|');
  }
  post['module'] = Drupal.settings.hierarchical_select.settings[hsid].module;
  post['save_lineage'] = Drupal.settings.hierarchical_select.settings[hsid].saveLineage;
  post['enforce_deepest'] = Drupal.settings.hierarchical_select.settings[hsid].enforceDeepest;
  post['level_labels'] = Drupal.settings.hierarchical_select.settings[hsid].levelLabels;
  post['params'] = Drupal.settings.hierarchical_select.settings[hsid].params;
  post['required'] = Drupal.settings.hierarchical_select.settings[hsid].required;
  post['multiple'] = Drupal.settings.hierarchical_select.settings[hsid].multiple;

  return post;
};

HierarchicalSelect.add = function(hsid) {
  var url = Drupal.settings.hierarchical_select.url;
  var $selects = $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context);

  // Get all selected items.
  var fullSelection = new Array();
  $('select.hierarchical-select-'+ hsid +' option:selected', HierarchicalSelect.context).each(function() {
    fullSelection.push($(this).val());
  });

  post = HierarchicalSelect.post(hsid, fullSelection);
  post.type = 'dropbox';

  $.ajax({
    type: "POST",
    url: url,
    data: post,
    dataType: "json",
    success: function(json){
      // Load the HTML.
      $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-input', HierarchicalSelect.context)
      .html(json.selects);
      $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-dropbox', HierarchicalSelect.context)
      .html(json.dropbox);

      HierarchicalSelect.dropboxContent[hsid] = json.dropboxLineagesSelections;

      // Re-attach bindings.
      HierarchicalSelect.attachBindings(hsid);
    }
  });
};

HierarchicalSelect.update = function(hsid, selection) {
  var animationDelay = Drupal.settings.hierarchical_select.settings[hsid].animationDelay;
  var url = Drupal.settings.hierarchical_select.url;
  var multiple = Drupal.settings.hierarchical_select.settings[hsid].multiple;
  var saveLineage = Drupal.settings.hierarchical_select.settings[hsid].saveLineage;
  var fullSelection = HierarchicalSelect.getFullSelection(hsid, selection);
  var lastUnchanged;

  var $selects = $('select.hierarchical-select-'+ hsid +'-hierarchical-select', HierarchicalSelect.context);
  lastUnchanged = $selects.index($('select.hierarchical-select-'+ hsid +'-hierarchical-select option[@value='+ selection +']', HierarchicalSelect.context).parent()[0]);

  // Drop out the *original* selects of the levels deeper than the select of
  // the level that just changed.
  $selects.gt(lastUnchanged).DropOutLeft(animationDelay);

  var post = HierarchicalSelect.post(hsid, fullSelection);
  post.type = 'selects';

  $.ajax({
    type: "POST",
    url: url,
    data: post,
    dataType: "json",
    success: function(json){
      // Load the HTML.
      $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-input', HierarchicalSelect.context)
      .html(json.html);

      $selects = $('select.hierarchical-select-'+ hsid + '-hierarchical-select', HierarchicalSelect.context);

      // Hide the loaded selects after the one that was just changed, then  drop
      // them in.
      $selects.gt(lastUnchanged).hide(0).DropInLeft(animationDelay);

      if (selection == 'none') {
        // Reset the original select.
        $('select.hierarchical-select-'+ hsid, HierarchicalSelect.context).val(0);
      }
      else {
        // Update the original select.
        HierarchicalSelect.updateOriginalSelect(hsid);
      }

      // Re-attach bindings.
      HierarchicalSelect.attachBindings(hsid);
    }
  });
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    HierarchicalSelect.initialize();
  });
}
