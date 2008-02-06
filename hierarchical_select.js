// $Id$

var HierarchicalSelect = HierarchicalSelect || {};

HierarchicalSelect.dropboxContent = new Array();

HierarchicalSelect.context = function() {
  return $("form div.form-item");
};

HierarchicalSelect.setting = function(hsid, settingName, newValue) {
  // Global settings.
  if (hsid == 'global') {
    return Drupal.settings.hierarchical_select[settingName];
  }
  else {
    // Per-Hierarchical Select settings.
    if (undefined === newValue) {
      return Drupal.settings.hierarchical_select.settings[hsid][settingName];
    }
    else {
      Drupal.settings.hierarchical_select.settings[hsid][settingName] = newValue;
    }
  }
};

HierarchicalSelect.waitToggle = function(hsid) {
  if ($('#hierarchical-select-' + hsid +'-container').css('opacity') != 0.5) {
    // Disable *all* submit buttons in this form, as well as all input-related
    // elements of the current hierarchical select.
    $('form[#hierarchical-select-' + hsid +'-container] input[@type=submit]')
    .add('#hierarchical-select-' + hsid +'-container .hierarchical-select-input').children()
    .attr('disabled', 'disabled');

    // Make everything related to the hierarchical select form item transparent.
    $('#hierarchical-select-' + hsid +'-container').css('opacity', 0.5);

    // Indicate that the user has to wait.
    $('body').css('cursor', 'wait');  
  }
  else {
    $('form[#hierarchical-select-' + hsid +'-container] input[@type=submit]')
    .add('#hierarchical-select-' + hsid +'-container .hierarchical-select-input').children()
    .removeAttr('disabled');

    $('#hierarchical-select-' + hsid +'-container').css('opacity', 1);

    $('body').css('cursor', 'auto');  
  }
};

// Should always be called *after* attachBindings(), because this method
// disables the "Add" button, which is only available after that method call.
HierarchicalSelect.checkDropboxLimit = function(hsid, initial) {
  var HS = HierarchicalSelect;
  var dropboxLimit = HS.setting(hsid, 'dropboxLimit');
  var multiple = HS.setting(hsid, 'multiple');

  // Set default value for the "initial" parameter.
  initial = (undefined === initial) ? false : initial;

  if (multiple && dropboxLimit > 0) {
    if (HS.dropboxContent[hsid].length == dropboxLimit) {
      $('#hierarchical-select-'+ hsid +'-container .hierarchical-select-input')
      .css('opacity', 0.5)
      // TODO: should be translatable. But that's a lot easier in Drupal 6, so let's postpone it.
      .after('<p class="hierarchical-select-dropbox-limit-warning">You\'ve reached the maximal number of items you can select.</p>')
      .children()
      .attr('disabled', 'disabled');
      $('#hierarchical-select-'+ hsid +'-container p.hierarchical-select-dropbox-limit-warning', HS.context)
      .hide()
      .show((initial) ? 0 : 'fast');
    }
    else if (HS.dropboxContent[hsid].length < dropboxLimit && $('#hierarchical-select-'+ hsid +'-container p.hierarchical-select-dropbox-limit-warning', HS.context).size()) {
      $('#hierarchical-select-'+ hsid +'-container .hierarchical-select-input')
      .css('opacity', 1)
      .children()
      .removeAttr('disabled');
      $('#hierarchical-select-'+ hsid +'-container p.hierarchical-select-dropbox-limit-warning', HS.context)
      .hide('fast', function() {
        $(this).remove();
      });
    }
  }
};

HierarchicalSelect.updateOriginalSelect = function(hsid) {
  var $selects = $('select.hierarchical-select-'+ hsid +'-select', this.context);
  var $options = $('select.hierarchical-select-'+ hsid +'-original-select option', this.context);

  // Reset the current selection in the original select.
  $('select.hierarchical-select-'+ hsid  +'-original-select option:selected', this.context).each(function() {
    $(this).removeAttr('selected');
  });

  var rootLevelValue = $('select#hierarchical-select-'+ hsid +'-select-level-0', this.context).val();

  // Update it to the current selection.
  var currentSelectionIsLabelOrNone = (typeof(rootLevelValue) == "string" && rootLevelValue.match(/^(none|label_\d+)$/));
  var somethingSelectedInDropbox = (this.setting(hsid, 'multiple') && this.dropboxContent[hsid].length);
  if (rootLevelValue.match(/^(all|none|label_\d+)$/)) {
    if (rootLevelValue == 'all') {
      $options.attr('selected', 'selected'); // Select all options.
    }
    else {
      $options.filter('option[@value=""]').attr('selected', 'selected'); // Select the "<none>" option.
    }

    // Get all sublevel selects, hide them (collapse effect) and remove them.
    $selects.gt(0)
    .hide(this.setting(hsid, 'animationDelay'), function() {
      $(this).remove();
    });
  }
  else if (currentSelectionIsLabelOrNone && !somethingSelectedInDropbox) {
    // This is for compatibility with Drupal's Taxonomy form items. They have
    // a "- None selected -" option, with the value "". We *must* select it if
    // we want to select nothing.
    // A similar system is used in the content_taxonomy implementation of HS,
    // to allow deselection of an item when multiple select is enabled.
    // TODO: make sure Drupal standardizes on a form item with a value "" to
    // select nothing. Perhaps I should also make Hierarchical Select use this
    // for its "<none>" option?
    $options.filter('option[@value=""]').attr('selected', 'selected');
  }
  else if (!this.setting(hsid, 'saveLineage')) {
    // Get the deepest valid value of the current selection.
    var level = $selects.length - 1;
    var deepestSelectValue = '';
    do {
      deepestSelectValue = $selects.eq(level).val();
      level--;
    } while (level >= 0 && deepestSelectValue.match(/label_\d+/));

    // Update the original select.
    $options.filter('option[@value="'+ deepestSelectValue +'"]').attr('selected', 'selected');
  }
  else {
    // Select each hierarchical select's selected option in the original
    // select (thus effectively saving the term lineage).
    $selects
    .each(function() { // Can be done cleaner in jQuery 1.2, because .val() can then accept an array.
      $options.filter('option[@value='+ $(this).val() +']').attr('selected', 'selected');
    });
  }

  // If multiple select is enabled, also add the selections in the dropbox.
  if (this.setting(hsid, 'multiple')) {
    for (var i = 0; i < this.dropboxContent[hsid].length; i++) {
      for (var j = 0; j < this.dropboxContent[hsid][i].length; j++) {
        $options
        .filter('option[@value='+ this.dropboxContent[hsid][i][j] +']')
        .attr('selected', 'selected');
      }
    }
  }
};

HierarchicalSelect.initialize = function() {
  for (var hsid in Drupal.settings.hierarchical_select.settings) {
    // If multiple select is enabled, intialize the dropbox content array.
    if (this.setting(hsid, 'multiple')) {
     this.dropboxContent[hsid] = this.setting(hsid, 'initialDropboxLineagesSelections');
    }

    $('select.hierarchical-select-'+ hsid +'-original-select', this.context)
    // Hide the standard select.
    .hide(0)
    // Add a unique container div after the standard select.
    .after('<div id="hierarchical-select-'+ hsid +'-container" class="hierarchical-select-container clear-block" />');

    // Now load the initial HTML *without* using AHAH.
    $('div#hierarchical-select-'+ hsid +'-container', this.context)
    .html(this.setting(hsid, 'initial'));

    this.updateOriginalSelect(hsid);
    this.attachBindings(hsid);
    this.checkDropboxLimit(hsid, true);
  }
};

HierarchicalSelect.attachBindings = function(hsid, dropboxOnly) {
  // Update event: attach to every select of the current Hierarchical Select.
  $('select.hierarchical-select-'+ hsid +'-select', this.context)
  .unbind()
  .change(function(x) {
    return function() { HierarchicalSelect.update(x, $(this).val()); };
  }(hsid));

  if (this.setting(hsid, 'multiple')) {
    if (!dropboxOnly) {
      // Add the "Add" button.
      $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-input', this.context)
      .append(this.setting(hsid, 'addButton'));

      // Add event: attach to the "Add" button.
      $('#hierarchical-select-'+ hsid +'-add-to-dropbox', this.context)
      .unbind()
      .click(function(x) {
        return function() { HierarchicalSelect.add(x); };
      }(hsid));
    }

    for (var i = 0; i < this.dropboxContent[hsid].length; i++) {
      // Remove event: attach to the "Remove" links.
      $('#hierarchical-select-'+ hsid +'-remove-'+ i + '-from-dropbox', this.context)
      .unbind()
      .click(function(x, y) {
        return function() { HierarchicalSelect.remove(x, y); };
      }(hsid, i));
    }    
  }
};

HierarchicalSelect.getFullSelection = function(hsid, selection) {
  var $selects = $('select.hierarchical-select-'+ hsid +'-select', this.context);

  // Make sure selection is always an array.
  if ("string" == typeof(selection)) {
    selection = new Array(selection);
  }

  if (this.setting(hsid, 'saveLineage')) {
    var lineageSelection = new Array();
    for (var level = 0; level < $selects.size(); level++) {
      var s = $('select#hierarchical-select-'+ hsid +'-select-level-'+ level, this.context).val();
      lineageSelection[level] = s;
      if (s == selection) {
        // Don't go collect values from levels deeper than the clicked level,
        // they have to be tossed away anyway.
        break;
      }
    }
  }

  return (undefined === lineageSelection) ? selection : lineageSelection;
};

HierarchicalSelect.post = function(hsid, fullSelection, type) {
  var post = new Object();
  post['hsid'] = hsid;
  if (typeof(fullSelection) == "string") {
    post['selection'] = fullSelection;
  }
  else {
    post['selection'] = fullSelection.join('|');
  }
  post['module'] = this.setting(hsid, 'module');
  post['save_lineage'] = this.setting(hsid, 'saveLineage');
  post['enforce_deepest'] = this.setting(hsid, 'enforceDeepest');
  post['all_option'] = this.setting(hsid, 'allOption');
  post['level_labels'] = this.setting(hsid, 'levelLabels');
  post['params'] = this.setting(hsid, 'params');
  post['required'] = this.setting(hsid, 'required');
  post['dropbox_title'] = this.setting(hsid, 'dropboxTitle');
  post['type'] = type;

  return post;
};

HierarchicalSelect.add = function(hsid) {
  var HS = HierarchicalSelect;
  var $selects = $('select.hierarchical-select-'+ hsid +'-select', HS.context);

  // Get all selected items.
  var fullSelection = new Array();
  $('select.hierarchical-select-'+ hsid  +'-original-select option:selected', this.context).each(function() {
    fullSelection.push($(this).val());
  });

  HS.waitToggle(hsid);
  $.ajax({
    type: "POST",
    url: HS.setting('global', 'url'),
    data: HS.post(hsid, fullSelection, 'dropbox'),
    dataType: "json",
    success: function(json){
      $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-input', HS.context)
      .html(json.selects);
      $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-dropbox', HS.context)
      .html(json.dropbox);

      HS.dropboxContent[hsid] = json.dropboxLineagesSelections;

      HS.waitToggle(hsid);
      HS.updateOriginalSelect(hsid); // In theory we don't have to do this, but it's a safety net: it will only set valid selections.
      HS.attachBindings(hsid);
      HS.checkDropboxLimit(hsid);
    }
  });
};

HierarchicalSelect.remove = function(hsid, dropboxEntry) {
  var HS = HierarchicalSelect;
  var $selects = $('select.hierarchical-select-'+ hsid +'-select', HS.context);

  // Add the selections of all items in the dropbox to the selection, except
  // for the one that has to be removed. If we submit this, the server will
  // reconstruct all lineages and thus remove the removed selection.
  var fullSelection = new Array();
  for (var i = 0; i < HierarchicalSelect.dropboxContent[hsid].length; i++) {
    if (i != dropboxEntry) {
      for (var j = 0; j < HierarchicalSelect.dropboxContent[hsid][i].length; j++) {
        fullSelection.push(HierarchicalSelect.dropboxContent[hsid][i][j]);
      }
    }
  }

  HS.waitToggle(hsid);

  $.ajax({
    type: "POST",
    url: HS.setting('global', 'url'),
    data: HS.post(hsid, fullSelection, 'dropbox-remove'),
    dataType: "json",
    success: function(json){
      $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-dropbox', this.context)
      .html(json.dropbox);

      HS.dropboxContent[hsid] = json.dropboxLineagesSelections;

      HS.waitToggle(hsid);
      HS.updateOriginalSelect(hsid);
      HS.attachBindings(hsid, true);
      HS.checkDropboxLimit(hsid);
    }
  });
};

HierarchicalSelect.update = function(hsid, selection) {
  var HS = HierarchicalSelect;

  // Don't query the server in special cases.
  if (selection.match(/^(all|none|label_\d+)$/)) {
    HS.updateOriginalSelect(hsid);
  }
  else {    
    var animationDelay = HS.setting(hsid, 'animationDelay');

    var $selects = $('select.hierarchical-select-'+ hsid +'-select', HS.context);
    var lastUnchanged = $selects.index($('select.hierarchical-select-'+ hsid +'-select option[@value='+ selection +']', HS.context).parent()[0]);

    HS.waitToggle(hsid);

    // Drop out the *original* selects of the levels deeper than the select of
    // the level that just changed.
    $selects.gt(lastUnchanged).DropOutLeft(animationDelay);

    $.ajax({
      type: "POST",
      url: HierarchicalSelect.setting('global', 'url'),
      data: HierarchicalSelect.post(hsid, HS.getFullSelection(hsid, selection), 'selects'),
      dataType: "json",
      success: function(json){
        $('div#hierarchical-select-'+ hsid +'-container .hierarchical-select-input', HS.context)
        .html(json.html);

        $selects = $('select.hierarchical-select-'+ hsid + '-select', HS.context);

        // Hide the loaded selects after the one that was just changed, then  drop
        // them in.
        $selects.gt(lastUnchanged).hide(0).DropInLeft(animationDelay);

        HS.waitToggle(hsid);
        HS.updateOriginalSelect(hsid);
        HS.attachBindings(hsid);
      }
    });
  }
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    HierarchicalSelect.initialize();
  });
}
