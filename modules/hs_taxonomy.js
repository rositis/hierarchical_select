// $Id$

Drupal.HierarchicalSelectTaxonomyForm = {};

(function ($) {
  
Drupal.HierarchicalSelectTaxonomyForm.dependentOnHS = function() {
  var $HSCheckbox = $('#edit-hierarchical-select-status');

  var showHide = function(speed) {
    var $affected = $('#edit-tags, #edit-multiple').parent().parent();
    if ($HSCheckbox.is(':checked')) {
      $affected.hide(speed);
    }
    else {
      $affected.show(speed);
    }
  };

  $HSCheckbox.change(function() { showHide(200); });
  showHide(0);
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    Drupal.HierarchicalSelectTaxonomyForm.dependentOnHS();
  });
}

})(jQuery);
