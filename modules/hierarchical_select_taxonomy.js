// $Id$

if (Drupal.jsEnabled) {
	$(document).ready(function(){
		var td;
		var cols;
	  $("form#views-filters table td[.hierarchical-select]").each(function() {
      td = $(this);
      cols = td.siblings().length;

      // Add another row to the table.
  		$("form#views-filters div table tbody")
      .append('<tr class="odd"></tr>');
    
      // Update colspan of the td in which our modified exposed filter sists.
      td.attr("colspan", cols);
                  
      // Move all filters except our modified one to the newly added row.
      td.siblings()
      .appendTo("form#views-filters div table tbody tr.odd:last-child");

      // Reduce the number of headers to the number of columns we have left.
      $("form#views-filters div table thead tr th").gt(cols - 1).remove();
    });
	});
}