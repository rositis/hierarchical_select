// $Id$

Drupal.HierarchicalSelectTaxonomyForm = {};

Drupal.HierarchicalSelectTaxonomyForm.levelLabels = function() {
  var $statusSelect = $('select#edit-hierarchical-select-level-labels-level-labels-status');

  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }
    if ($statusSelect.val() ==  0) {
      $('.hierarchical-select-level-label').parent().hide(speed);
    }
    else {
      $('.hierarchical-select-level-label').parent().show(speed);
    }
  };

  $statusSelect.change(showHide);
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
    Drupal.HierarchicalSelectTaxonomyForm.levelLabels();
    Drupal.HierarchicalSelectTaxonomyForm.dependentOnMultipleSetting();
  });
}
