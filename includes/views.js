// $Id$

/**
 * @file
 * Corrects the table that contains the exposed filters for Views. It puts
 * each hierarchical select in its own row.
 */

if (Drupal.jsEnabled) {
  $(document).ready(function(){
    var td;
    var cols;
    var i = 0;;
    $("form#views-filters, form#views-filterblock")
    .find('table td:has(.hierarchical-select-wrapper)')
    .each(function() {
      i++;
      td = $(this);
      cols = td.siblings().length;

      // Add another row to the table.
      $("form#views-filters > div > table > tbody")
      .append('<tr class="odd" id="hs-new-row-' + i + '"></tr>');
    
      // Update colspan of the td in which our modified exposed filter exists.
      td.attr("colspan", cols);

      // Move all filters except our modified one to the newly added row.
      td.siblings()
      .appendTo("#hs-new-row-"+ i);

      // Reduce the number of headers to the number of columns we have left.
      $("form#views-filters div table thead tr th").slice(cols).remove();
    });

    $('form#views-filters, form#views-filterblock').submit(function() {
      // Remove the Hierarchical Select form build id and the form id, to
      // prevent them from ending up in the GET URL.
      $('#edit-hs-form-build-id, #edit-views-filters, #edit-views-filterblock').remove();

      // Prepare the hierarchical select form elements that are used as
      // exposed filters for a GET submit.
      $('form#views-filters, form#views-filterblock')
      .find('.hierarchical-select-wrapper')
      .trigger('prepare-GET-submit');
    });
  });
}
