// $Id$

Drupal.HierarchicalSelectConfigForm = {};

(function ($, cfg) {

cfg.context = function(configId) {
  if (configId === undefined) {
    return $('form .hierarchical-select-config-form');
  }
  else {
    return $('#hierarchical-select-config-form-'+ configId);
  }
};

cfg.levelLabels = function(configId) {
  var $status = $('.level-labels-status', cfg.context(configId));
  var $enforceDeepest = $('.enforce-deepest input', cfg.context(configId));

  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }

    $affected = $('.level-label', cfg.context(configId)); 
    if (!$status.is(':checked')) {
      $affected.parent().hide(speed);
    }
    else {
      if ($enforceDeepest.eq(1).is(':checked')) {
        $affected.parent().show(speed);
      }
      else {
        $affected.gt(0).parent().hide(speed);
        $affected.lt(1).parent().show(speed);
      }
    }
  };

  $status.click(showHide);
  $enforceDeepest.click(showHide);
  showHide(0);
};

cfg.dropbox = function(configId) {
  var $status = $('.dropbox-status', cfg.context(configId));

  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }

    var $affected = $('.dropbox-title, .dropbox-limit', cfg.context(configId)).parent();
    if ($status.is(':checked')) {
      $affected.show(speed);
    }
    else {
      $affected.hide(speed);
    }
  };

  $status.click(showHide);
  showHide(0);
};

cfg.editability = function(configId) {
  var $status = $('.editability-status', cfg.context(configId));
  var $allowNewLevels = $('.editability-allow-new-levels', cfg.context(configId)); 

  var showHide = function(speed) {
    if (speed === undefined) {
      speed = 200;
    }

    var $affected = $('.editability-item-type, label[.editability-allow-new-levels]', cfg.context(configId)).parent();
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
    if (speed === undefined) {
      speed = 200;
    }

    $affected = $('.editability-max-levels', cfg.context(configId)).parent();
    if ($allowNewLevels.is(':checked')) {
      $affected.show(speed);
    }
    else {
      $affected.hide(speed);
    }
  };

  $status.click(showHide);
  $allowNewLevels.click(showHideMaxLevels);
  showHideMaxLevels(0);
  showHide(0);
};

if (Drupal.jsEnabled) {
  $(document).ready(function() {
    for (var id in Drupal.settings.HierarchicalSelect.configForm) {
      var configId = Drupal.settings.HierarchicalSelect.configForm[id];

      cfg.levelLabels(configId);
      cfg.dropbox(configId);
      cfg.editability(configId);
    }
  });
}

})(jQuery, Drupal.HierarchicalSelectConfigForm);
