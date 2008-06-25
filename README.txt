$Id$

Description
-----------
This module defines the "hierarchical_select" form element, which is a much
enhanced way for letting the user select an option in a hierarchy.

Hierarchical Select has the ability to save the entire lineage of a selection
or only the "deepest" selection. You can configure it to force the user to
make a selection as deep as possible in the tree, or allow the user to select
an item anywhere in the tree. Levels can be labeled, you can configure limit
the number of items that can be selected, configure a title for the dropbox,
choose a site-wide animation delay, and so on. You can even create new items
and levels through Hierarchical Select.


Dependencies
------------
* jQuery Update 1.x (http://drupal.org/project/jquery_update)


Integrates with
---------------
* Taxonomy (Drupal core)
* Content Taxonomy (http://drupal.org/project/content_taxonomy)
* Taxonomy Subscriptions (http://drupal.org/project/subscriptions)
* Views 5.x-1.x-dev tarball of May 11 or later (http://drupal.org/project/views)
  or apply this patch: http://drupal.org/files/issues/hs_compatibility.patch


Installation
------------
1) Place this module directory in your modules folder (this will usually be
"sites/all/modules/").

2) Install the modules it depends on. Don't forget to copy the jquery.js file
included in the jQuery Update module to the "misc" directory!

3) Enable the module.

4) If you want to use it for one or more of your vocabularies, go to
admin/content/taxonomy and click the "edit" link for a vocabulary. Now scroll
down and you'll find a whole range of Hierarchical Select settings. All
settings are explained there as well.


Troubleshooting
---------------
If you ever have problems, make sure to go through these steps:

1) Go to admin/logs/status (i.e. the Status Report). Ensure that the status
   of the following modules is ok:
   - jQuery Update
   - Hierarchical Select
   - Hierarchical Select Taxonomy Views (if installed)

2) Ensure that the page isn't being served from your browser's cache. Use
   CTRL+R in Windows/Linux browsers, CMD+R in Mac OS X browsers to enforce the
   browser to reload everything, preventing it from using its cache.

3) When using Hierarchical Select for forum selection (with forum.module), you
   *must* enable the setting "Save only the deepest item".
   See http://drupal.org/node/241766#comment-808464.

4) When using the Hierarchical Select Content Taxonomy module, you must
   configure the "Save options" setting to "Save as tag".
   See http://drupal.org/node/207252#comment-685906
   and http://drupal.org/node/261341#comment-874417.

5) When using the Hierarchical Select Content Taxonomy module, you must
   make sure that the "Multiple values" setting of the field matches the
   "Enable the dropbox" setting of that field's Hierarchical Select config!

6) When using the Hierarchical Select Content Taxonomy module, if you have the
   "Save term lineage" setting enabled of that field's Hierarchical Select
   config, you must also enable the "Multiple values" setting of that field!
   See http://drupal.org/node/261341#comment-866601.

In case of problems, don't forget to try a hard refresh in your browser!


Sponsors
--------
* Initial development:
   Paul Ektov of http://autobin.ru.
* Abstraction, to let other modules than taxonomy hook in:
   Etienne Leers of http://creditcalc.biz.
* Support for saving the term lineage:
   Paul Ektov of http://autobin.ru.
* Multiple select support:
   Marmaladesoul, http://marmaladesoul.com.
* Taxonomy Subscriptions support:
   Mr Bidster Inc.
* Ability to create new items/levels:
   The Worx Company, http://www.worxco.com.


Author
------
Wim Leers

* mail: work@wimleers.com
* website: http://wimleers.com/work

The author can be contacted for paid customizations of this module as well as
Drupal consulting and development.
