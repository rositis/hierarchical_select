// $Id$

(function ($) {

Drupal.HierarchicalSelect = {};

Drupal.HierarchicalSelect.context = function() {
  return $("form .hierarchical-select-wrapper");
};

Drupal.HierarchicalSelect.initialize = function() {
  if (this.cache != null) {
    this.cache.initialize();
  }

  for (var hsid in Drupal.settings.HierarchicalSelect.settings) {
    this.transform(hsid);
    this.attachBindings(hsid);
    if (this.cache != null && this.cache.status()) {
      this.cache.load(hsid);
    }
  }
};

Drupal.HierarchicalSelect.transform = function(hsid) {
  var removeString = $('#hierarchical-select-'+ hsid +'-wrapper .dropbox .dropbox-remove:first', Drupal.HierarchicalSelect.context).text();

  $('#hierarchical-select-'+ hsid +'-wrapper', Drupal.HierarchicalSelect.context)
  // Remove the .nojs div.
  .find('.nojs').remove().end()
  // Find all .dropbox-remove cells in the dropbox table.
  .find('.dropbox .dropbox-remove')
  // Hide the children of these table cells. We're not removing them because
  // we want to continue to use the "Remove" checkboxes.
  .find('*').hide().end()
  // Put a "Remove" link there instead.
  .append('<a href="">'+ removeString +'</a>');
};

Drupal.HierarchicalSelect.disableForm = function(hsid) {
  // Disable *all* submit buttons in this form, as well as all input-related
  // elements of the current hierarchical select.
  $('form[#hierarchical-select-' + hsid +'-wrapper] input[@type=submit]')
  .add('#hierarchical-select-' + hsid +'-wrapper .hierarchical-select > *')
  .attr('disabled', true);

  // Add the 'waiting' class. Default style: make everything transparent.
  $('#hierarchical-select-' + hsid +'-wrapper').addClass('waiting');

  // Indicate that the user has to wait.
  $('body').css('cursor', 'wait');
};

Drupal.HierarchicalSelect.enableForm = function(hsid) {
  // This method undoes everything the disableForm() method did.

  $('form[#hierarchical-select-' + hsid +'-wrapper] input[@type=submit]')
  .add('#hierarchical-select-' + hsid +'-wrapper .hierarchical-select > *')
  .attr('disabled', false);

  $('#hierarchical-select-' + hsid +'-wrapper').removeClass('waiting');

  $('body').css('cursor', 'auto');
};

Drupal.HierarchicalSelect.attachBindings = function(hsid) {
  var addOpString = $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select input', Drupal.HierarchicalSelect.context).val();
  var createNewItemOpString = $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select .create-new-item-create', Drupal.HierarchicalSelect.context).val();
  var cancelNewItemOpString = $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select .create-new-item-cancel', Drupal.HierarchicalSelect.context).val();

  $('#hierarchical-select-'+ hsid +'-wrapper', this.context)
  // "hierarchical select" event
  .find('.hierarchical-select > select').unbind().change(function(_hsid) {
    return function() { Drupal.HierarchicalSelect.update(_hsid, 'update hierarchical select', { select_id : $(this).attr('id') }); };
  }(hsid)).end()

  // "create new item" event
  .find('.hierarchical-select .create-new-item .create-new-item-create').unbind().click(function(_hsid) {
    return function() {
      Drupal.HierarchicalSelect.update(_hsid, 'create new item', { opString : createNewItemOpString });
      return false; // Prevent the browser from POSTing the page.
    };
  }(hsid)).end()

  // "cancel new item" event"
  .find('.hierarchical-select .create-new-item .create-new-item-cancel').unbind().click(function(_hsid) {
    return function() {
      Drupal.HierarchicalSelect.update(_hsid, 'cancel new item', { opString : cancelNewItemOpString });
      return false; // Prevent the browser from POSTing the page (in case of the "Cancel" button).
    };
  }(hsid)).end()

  // "create new level" event
  .find('.hierarchical-select .create-new-level .create-new-item-create').unbind().click(function(_hsid) {
    return function() {
      Drupal.HierarchicalSelect.update(_hsid, 'create new level', { opString : createNewItemOpString });
      return false; // Prevent the browser from POSTing the page.
    };
  }(hsid)).end()

  // "cancel new level" event"
  .find('.hierarchical-select .create-new-level .create-new-item-cancel').unbind().click(function(_hsid) {
    return function() {
      Drupal.HierarchicalSelect.update(_hsid, 'cancel new level', { opString : cancelNewItemOpString });
      return false; // Prevent the browser from POSTing the page (in case of the "Cancel" button).
    };
  }(hsid)).end()

  // "add to dropbox" event
  .find('.hierarchical-select .add-to-dropbox').unbind().click(function(_hsid) {
    return function() {
      Drupal.HierarchicalSelect.update(_hsid, 'add to dropbox', { opString : addOpString });
      return false; // Prevent the browser from POSTing the page.
    };
  }(hsid)).end()

  // "remove from dropbox" event
  // (anchors in the .dropbox-remove cells in the .dropbox table)
  .find('.dropbox .dropbox-remove a').unbind().click(function(_hsid) {
    return function() {
      // Check the (hidden, because JS is enabled) checkbox that marks this
      // dropbox entry for removal. 
      $(this).parent().find('input[@type=checkbox]').attr('checked', true);
      Drupal.HierarchicalSelect.update(_hsid, 'remove from dropbox', {});
      return false; // Prevent the browser from POSTing the page.
    };
  }(hsid));
};

Drupal.HierarchicalSelect.preUpdateAnimations = function(hsid, updateType, lastUnchanged, callback) {
  switch (updateType) {
    case 'update hierarchical select':
      // Drop out the selects of the levels deeper than the select of the
      // level that just changed.
      var animationDelay = Drupal.settings.HierarchicalSelect.settings[hsid]['animationDelay'];
      var $animatedSelects = $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select > select', Drupal.HierarchicalSelect.context).gt(lastUnchanged);
      if ($animatedSelects.size() > 0) {
        $animatedSelects.hide();
        for (var i = 0; i < $animatedSelects.size(); i++) {
          if (i < $animatedSelects.size() - 1) {
            $animatedSelects.eq(i).DropOutLeft(animationDelay);
          }
          else {
            $animatedSelects.eq(i).DropOutLeft(animationDelay, callback);
          }
        }
      }
      else if (callback) {
        callback();
      }
      break;
    default:
      if (callback) {
        callback();
      }  
      break;
  }
};

Drupal.HierarchicalSelect.postUpdateAnimations = function(hsid, updateType, lastUnchanged, callback) {
  switch (updateType) {
    case 'update hierarchical select':
      // Give focus to the input field of the "create new item/level" section,
      //  if it exists, and also select the existing text.
      $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select .create-new-item-input', Drupal.HierarchicalSelect.context).focus()[0].select();
      // Hide the loaded selects after the one that was just changed, then
      // drop them in.
      var animationDelay = Drupal.settings.HierarchicalSelect.settings[hsid]['animationDelay'];
      var $animatedSelects = $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select > select', Drupal.HierarchicalSelect.context).gt(lastUnchanged);
      if ($animatedSelects.size() > 0) {
        $animatedSelects.hide();
        for (var i = 0; i < $animatedSelects.size(); i++) {
          if (i < $animatedSelects.size() - 1) {
            $animatedSelects.eq(i).DropInLeft(animationDelay);
          }
          else {
            $animatedSelects.eq(i).DropInLeft(animationDelay, callback);
          }
        }
      }
      else if (callback) {
        callback();
      }
      break;
    default:
      if (callback) {
        callback();
      }
      break;
  } 
};

Drupal.HierarchicalSelect.triggerEvents = function(hsid, updateType) {
  $('#hierarchical-select-'+ hsid +'-wrapper', Drupal.HierarchicalSelect.context)
  .trigger(updateType);
};

Drupal.HierarchicalSelect.update = function(hsid, updateType, settings) {
  var post = $('form[#hierarchical-select-' + hsid +'-wrapper]', Drupal.HierarchicalSelect.context).formToArray();

  // Pass the hierarchical_select id via POST.
  post.push({ name : 'hsid', value : hsid });
  
  // If a cache system is installed, let the server know if it's running
  // properly. If it is running properly, the server will send back additional
  // information to maintain a lazily-loaded cache.
  if (Drupal.HierarchicalSelect.cache != null) {
    post.push({ name : 'client_supports_caching', value : Drupal.HierarchicalSelect.cache.status() });
  }

  // updateType is one of:
  // - 'none' (default)
  // - 'update hierarchical select'
  // - 'create new item'
  // - 'create new level'
  // - 'remove from dropbox'
  switch (updateType) {
    case 'update hierarchical select':
      var value = $('#'+ settings.select_id).val();
      var lastUnchanged = settings.select_id.replace(/^.*-hierarchical-select-selects-(\d+)$/, "$1");

      // Don't do anything if it's one of the "no action values".
      if (value == 'none' || value.match(/^label_\d+$/)) {
        Drupal.HierarchicalSelect.preUpdateAnimations(hsid, updateType, lastUnchanged, function() {
          // Remove the sublevels.
          $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select > select', Drupal.HierarchicalSelect.context)
          .gt(lastUnchanged).remove();
        });
        return;
      }
      break;

    case 'create new item':
    case 'cancel new item':
    case 'create new level':
    case 'cancel new level':
    case 'add to dropbox':
      post.push({ name : 'op', value : settings.opString });
      break;
  }

  // Construct the object that contains the options for a callback to the
  // server. If a client-side cache is found however, it's possible that this
  // won't be used.
  var ajaxOptions = {
    url:        Drupal.settings.HierarchicalSelect.url,
    type:       'POST',
    dataType:   'json',
    data:       post,
    beforeSend: function() { Drupal.HierarchicalSelect.disableForm(hsid); },
    success:    function(response) {
      // Replace the old HTML with the (relevant part of) retrieved HTML.
      $('#hierarchical-select-'+ hsid +'-wrapper', Drupal.HierarchicalSelect.context)
      .html($('.hierarchical-select-wrapper > *', $(response.output)));

      // Transform the hierarchical select and/or dropbox to the JS variant and
      // re-enable the disabled form items.
      Drupal.HierarchicalSelect.transform(hsid);
      Drupal.HierarchicalSelect.enableForm(hsid);

      Drupal.HierarchicalSelect.postUpdateAnimations(hsid, updateType, lastUnchanged, function() {
        // Reattach the bindings.
        Drupal.HierarchicalSelect.attachBindings(hsid);

        // Update the client-side cache when:
        // - information for in the cache is provided in the response, and
        // - the cache system is available, and
        // - the cache system is running.
        if (response.cache != null && Drupal.HierarchicalSelect.cache != null && Drupal.HierarchicalSelect.cache.status()) {
          Drupal.HierarchicalSelect.cache.sync(hsid, response.cache);
        }

        Drupal.HierarchicalSelect.triggerEvents(hsid, updateType);
      });
    }
  };

  // Use the client-side cache to update the hierarchical select when:
  // - the hierarchical select is being updated (i.e. no add/remove), and
  // - the cache system is available, and
  // - the cache system is running.
  // Otherwise, perform a normal dynamic form submit.
  if (updateType == 'update hierarchical select' && Drupal.HierarchicalSelect.cache != null && Drupal.HierarchicalSelect.cache.status()) {
    Drupal.HierarchicalSelect.cache.updateHierarchicalSelect(hsid, value, lastUnchanged, ajaxOptions);
  }
  else {
    Drupal.HierarchicalSelect.preUpdateAnimations(hsid, updateType, lastUnchanged, function() {
      $.ajax(ajaxOptions); 
    });
  }
};
  
if (Drupal.jsEnabled) {
  $(document).ready(function() {
    // If you set Drupal.settings.HierarchicalSelect.pretendNoJS to *anything*,
    // and as such, Hierarchical Select won't initialize its Javascript! It
    // will seem as if your browser had Javascript disabled.
    if (undefined != Drupal.settings.HierarchicalSelect.pretendNoJS) {
      return false;
    }
    
    Drupal.HierarchicalSelect.initialize();
  });
}

})(jQuery);
