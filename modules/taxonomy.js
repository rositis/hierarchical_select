// $Id$

Drupal.HierarchicalSelectTaxonomyForm = {};

Drupal.HierarchicalSelectTaxonomyForm.levelLabels = function() {
  var $statusSelect = $('select#edit-hierarchical-select-level-labels-level-labels-status');

  var showHideLevelLabels = function() {    
    if ($statusSelect.val() ==  0) {
      $('.hierarchical-select-level-label').parent().hide(0);
    }
    else {
      $('.hierarchical-select-level-label').parent().show(0);
    }
  };

  $statusSelect.change(showHideLevelLabels);
  showHideLevelLabels();
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    Drupal.HierarchicalSelectTaxonomyForm.levelLabels();
  });
}
