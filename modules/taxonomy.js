// $Id$

Drupal.HierarchicalSelectTaxonomyForm = {};

(function ($) {
  
Drupal.HierarchicalSelectTaxonomyForm.dependentOnHS = function() {
  var $HSCheckbox = $('#edit-hierarchical-select-status');

  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }

    var $affected = $('#edit-tags, #edit-multiple').parent().parent();
    if ($HSCheckbox.is(':checked')) {
      $affected.hide(speed);
    }
    else {
      $affected.show(speed);
    }
  };

  $HSCheckbox.change(showHide);
  showHide(0);
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    Drupal.HierarchicalSelectTaxonomyForm.dependentOnHS();
  });
}

})(jQuery);
