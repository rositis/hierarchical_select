// $Id$

Drupal.HierarchicalSelectTaxonomyForm = {};

Drupal.HierarchicalSelectTaxonomyForm.dependentOnHS = function() {
  var $HSCheckbox = $('#edit-hierarchical-select-status');

  var showHideFreetagging = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }
    if ($HSCheckbox.attr('checked') === true) {
      $('#edit-tags').parent().parent().hide(speed);
    }
    else {
      $('#edit-tags').parent().parent().show(speed);
    }
  };

  $HSCheckbox.change(showHideFreetagging);
  showHideFreetagging(0);
};

Drupal.HierarchicalSelectTaxonomyForm.levelLabels = function() {
  var $statusSelect = $('select#edit-hierarchical-select-level-labels-level-labels-status');
  var $enforceDeepestSelect = $('#edit-hierarchical-select-enforce-deepest');

  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }
    if ($statusSelect.val() ==  0) {
      $('.hierarchical-select-level-label').parent().hide(speed);
    }
    else {
      if ($enforceDeepestSelect.val() == 0) {
        $('.hierarchical-select-level-label').parent().show(speed);
      }
      else {
        $('.hierarchical-select-level-label').gt(0).parent().hide(speed);
        $('.hierarchical-select-level-label').lt(1).parent().show(speed);
      }
    }
  };

  $statusSelect.change(showHide);
  $enforceDeepestSelect.change(showHide);
  showHide(0);
};

Drupal.HierarchicalSelectTaxonomyForm.unitNames = function() {
  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }

    if ($('.hierarchical-select-allow-new-levels input:first').is(':checked') == true) {
      $('#edit-hierarchical-select-editability-max-levels').parent().hide(speed);
    }
    else {
      $('#edit-hierarchical-select-editability-max-levels').parent().show(speed);
    }

    if ($('.hierarchical-select-editable input:first').is(':checked') == true) {
      $('.hierarchical-select-item-type').parent()
      .add($('.hierarchical-select-allow-new-levels').parent())
      .add($('#edit-hierarchical-select-editability-max-levels').parent())
      .hide(speed);
    }
    else {
      $('.hierarchical-select-item-type').parent()
      .add($('.hierarchical-select-allow-new-levels').parent())
      .show(speed);
    }
  };

  $('.hierarchical-select-editable input, .hierarchical-select-allow-new-levels input').change(showHide);
  showHide(0);
};

Drupal.HierarchicalSelectTaxonomyForm.dependentOnMultipleSetting = function() {
  var $statusSelect = $('#edit-hierarchical-select-multiple');

  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }
    $('#edit-hierarchical-select-all-option, #edit-hierarchical-select-dropbox-dropbox-title, #edit-hierarchical-select-dropbox-dropbox-limit').each(function() {
      if ($statusSelect.attr('checked') === undefined) {
        $(this).parent().hide(speed);  
      }
      else {
        $(this).parent().show(speed);
      }
    });
  };

  $statusSelect.change(showHide);
  showHide(0);
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    Drupal.HierarchicalSelectTaxonomyForm.dependentOnHS();
    Drupal.HierarchicalSelectTaxonomyForm.levelLabels();
    Drupal.HierarchicalSelectTaxonomyForm.unitNames();
    Drupal.HierarchicalSelectTaxonomyForm.dependentOnMultipleSetting();
  });
}
