// $Id$

Drupal.HierarchicalSelect = {};

Drupal.HierarchicalSelect.context = function() {
  return $("form .hierarchical-select-wrapper");
};

Drupal.HierarchicalSelect.initialize = function() {
  for (var hsid in Drupal.settings.HierarchicalSelect.settings) {
    this.transform(hsid);
    this.attachBindings(hsid);
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
  .enable(false);

  // Add the 'waiting' class. Default style: make everything transparent.
  $('#hierarchical-select-' + hsid +'-wrapper').addClass('waiting');

  // Indicate that the user has to wait.
  $('body').css('cursor', 'wait');
};

Drupal.HierarchicalSelect.enableForm = function(hsid) {
  // This method undoes everything the disableForm() method did.

  $('form[#hierarchical-select-' + hsid +'-wrapper] input[@type=submit]')
  .add('#hierarchical-select-' + hsid +'-wrapper .hierarchical-select > *')
  .enable(true);

  $('#hierarchical-select-' + hsid +'-wrapper').removeClass('waiting');

  $('body').css('cursor', 'auto');
};

Drupal.HierarchicalSelect.attachBindings = function(hsid) {
  var addOpString = $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select input', Drupal.HierarchicalSelect.context).val();

  $('#hierarchical-select-'+ hsid +'-wrapper', this.context)
  // "Update" event will be attached to:
  // - selects in the .hierarchical-select div;
  .find('.hierarchical-select select')
  .unbind()
  .change(function(_hsid) {
    return function() { Drupal.HierarchicalSelect.update(_hsid, 'hierarchical select', { select_id : $(this).attr('id') }); };
  }(hsid)).end()

  // - if the dropbox is enabled: anchors in the .dropbox-remove cells in the
  //   .dropbox table.
  .find('.dropbox .dropbox-remove a')
  .unbind()
  .click(function(_hsid) {
    return function() {
      // Check the (hidden, because JS is enabled) checkbox that marks this
      // dropbox entry for removal. 
      $(this).parent().find('input[@type=checkbox]').attr('checked', true);
      
      Drupal.HierarchicalSelect.update(_hsid, 'remove', {});

      // Prevent the browser from POSTing the page.
      return false;
    };
  }(hsid)).end()

  // "Add" event will be attached to:
  // - the add button in the .hierarchical-select div.
  .find('.hierarchical-select input').unbind().click(function(_hsid) {
    return function() {
      Drupal.HierarchicalSelect.update(_hsid, 'add', { opString : addOpString });

      // Prevent the browser from POSTing the page.
      return false; 
    };
  }(hsid));
};

Drupal.HierarchicalSelect.update = function(hsid, updateType, settings) {
  var post = $('form[#hierarchical-select-' + hsid +'-wrapper]', Drupal.HierarchicalSelect.context).formToArray();

  // Pass the hierarchical_select id via POST.
  post.push({ name : 'hsid', value : hsid });

  // updateType is one of:
  // - 'none' (default)
  // - 'hierarchical select'
  // - 'remove'
  switch (updateType) {
    case 'hierarchical select':
      var animationDelay = Drupal.settings.HierarchicalSelect.settings[hsid]['animationDelay'];
      var lastUnchanged = settings.select_id.replace(/^.*-hierarchical-select-selects-(\d+)$/, "$1");
      break;

    case 'add':
      post.push({ name : 'op', value : settings.opString });
      break;
  }
  
  // beforeSend callback: effects and disabling the form.
  var beforeSendCallback = function(_hsid) {
    switch (updateType) {
      case 'hierarchical select':
        // Drop out the selects of the levels deeper than the select of the
        // level that just changed.
        $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select select', Drupal.HierarchicalSelect.context)
        .gt(lastUnchanged).DropOutLeft(animationDelay);
        break;
    }

    Drupal.HierarchicalSelect.disableForm(_hsid);
  }(hsid);

  var successCallback = function(response) {
    var _hsid = hsid;

    // Replace the old HTML with the (relevant part of) retrieved HTML.
    $('#hierarchical-select-'+ _hsid +'-wrapper', Drupal.HierarchicalSelect.context)
    .html($('.hierarchical-select-wrapper > *', $(response.output)));

    // TODO: use HTML client storage when available. Only for caching the
    // results of the hierarchical select. See http://drupal.org/node/235932.
    // This is why we're still using JSON as the response format and not HTML.

    // Transform the hierarchical select and/or dropbox to the JS variant and
    // re-enable the disabled form items.
    Drupal.HierarchicalSelect.transform(_hsid);
    Drupal.HierarchicalSelect.enableForm(_hsid);

    // Apply effects if applicable.
    switch (updateType) {
      case 'hierarchical select':
        // Hide the loaded selects after the one that was just changed, then
        // drop them in.
        $('#hierarchical-select-'+ hsid +'-wrapper .hierarchical-select select', Drupal.HierarchicalSelect.context)
        .gt(lastUnchanged).hide().DropInLeft(animationDelay);
        break;
    } 

    // Reattach the bindings.
    Drupal.HierarchicalSelect.attachBindings(_hsid);
  };

  // Perform the dynamic form submit.
  $.ajax({
    url:        Drupal.settings.HierarchicalSelect.url,
    type:       'POST',
    dataType:   'json',
    data:       post,
    beforeSend: beforeSendCallback,
    success:    successCallback
  });
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
