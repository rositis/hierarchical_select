// $Id$

Drupal.HierarchicalSelectConfigForm = {};

(function ($, cfg) {

cfg.context = function(configId) {
  if (configId === undefined) {
    return $('.hierarchical-select-config-form > *').not('.live-preview');
  }
  else {
    return $('#hierarchical-select-config-form-'+ configId + ' > *').not('.live-preview');
  }
};

cfg.levelLabels = function(configId) {
  var $status = $('.level-labels-status', cfg.context(configId));
  var $enforceDeepest = $('.enforce-deepest input', cfg.context(configId));

  var showHide = function(speed) {
    $affected = $('.level-labels-settings', cfg.context(configId)); 
    if (!$status.is(':checked')) {
      $affected.hide(speed);
    }
    else {
      if ($enforceDeepest.slice(1, 2).is(':checked')) {
        $affected
        .find('tr').slice(2) // Make sure all tr's are shown.
        .add($affected) // The entire table should be shown.
        .show(speed, function() {
          // jQuery leaves style="display:block;" behind, which causes badly
          // displayed tr's.
          $(this).removeAttr('style');
        });
      }
      else {
        $affected.find('tr').slice(0, 2).show(speed); // Show header tr and root level tr.
        $affected.find('tr').slice(2).hide(speed); // Hide all other tr's.
      }
    }
  };

  $status.click(function() { showHide(200); });
  $enforceDeepest.click(function() { showHide(200); });
  showHide(0);
};

cfg.dropbox = function(configId) {
  var $status = $('.dropbox-status', cfg.context(configId));

  var showHide = function(speed) {
    var $affected = $('.dropbox-title, .dropbox-limit, .dropbox-reset-hs', cfg.context(configId)).parent();
    if ($status.is(':checked')) {
      $affected.show(speed);
    }
    else {
      $affected.hide(speed);
    }
  };

  $status.click(function() { showHide(200); });
  showHide(0);
};

cfg.editability = function(configId) {
  var $status = $('.editability-status', cfg.context(configId));
  var $allowNewLevels = $('.editability-allow-new-levels', cfg.context(configId)); 

  var showHide = function(speed) {
    var $affected = $('.editability-per-level-settings, .form-item:has(.editability-allow-new-levels)', cfg.context(configId));
    var $maxLevels = $('.editability-max-levels', cfg.context(configId)).parent();
    if ($status.is(':checked')) {
      if ($allowNewLevels.is(':checked')) {
        $affected.add($maxLevels);
      }
      $affected.show(speed);
    }
    else {
      $affected.add($maxLevels).hide(speed);
    }
  };

  var showHideMaxLevels = function(speed) {
    $affected = $('.editability-max-levels', cfg.context(configId)).parent();
    if ($allowNewLevels.is(':checked')) {
      $affected.show(speed);
    }
    else {
      $affected.hide(speed);
    }
  };

  $status.click(function() { showHide(200); });
  $allowNewLevels.click(function() { showHideMaxLevels(200); });
  showHideMaxLevels(0);
  showHide(0);
};

cfg.livePreview = function(configId) {
  // React on changes to any input, except the ones in the live preview.
  $updateLivePreview = $('input', cfg.context(configId))
  .filter(':not(.create-new-item-input):not(.create-new-item-create):not(.create-new-item-cancel)')
  .change(function() {
    // TODO: Do an AJAX submit of the entire form.
  });  
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    for (var id in Drupal.settings.HierarchicalSelect.configForm) {
      var configId = Drupal.settings.HierarchicalSelect.configForm.id;

      cfg.levelLabels(configId);
      cfg.dropbox(configId);
      cfg.editability(configId);
      //cfg.livePreview(configId);
    }
  });
}

})(jQuery, Drupal.HierarchicalSelectConfigForm);
