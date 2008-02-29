$Id$

Description
-----------
This module defines the "hierarchical_select" form element, which is a much
enhanced way for letting the user select an option in a hierarchy. Out of the
box, this module implements the hierarchical_select hooks for the taxonomy
(which automatically includes support for the forum module), content_taxonomy
and subscriptions_taxonomy modules. It also converts hierarchical vocabularies
that are used as exposed filters in any View to a hierarchical select.

Any module that uses a select form element, of which the options are ordered
hierarchically, can take advantage of this new form element. Especially when
there's a deep hierarchy, or when there are a lot of options in each sublevel,
this form element greatly simplifies the user's search for the right option.

Hierarchical Select has the ability to save the entire lineage of a selection
or only the "deepest" selection. You can configure it to force the user to
make a selection as deep as possible in the tree, or allow the user to select
an item anywhere in the tree. Levels can be labeled, you can configure limit
the number of items that can be selected, configure a title for the dropbox,
choose a site-wide animation delay, and so on.

The Taxonomy implementation of Hierarchical Select can be configured per
vocabulary: it can be turned on/off and you can take advantage of all features
mentioned above.


Dependencies
------------
* jQuery Interface (http://drupal.org/project/jquery_interface)
  * jQuery Update (http://drupal.org/project/jquery_update)


Integrates with
---------------
* Taxonomy (Drupal core)
* Content Taxonomy (http://drupal.org/project/content_taxonomy)
* Taxonomy Subscriptions (http://drupal.org/project/subscriptions)
* Views (http://drupal.org/project/views)


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

NOTE: When using a content_taxonomy CCK field, you must configure it to use
      either "Save as tag" or "Both" as "Save options". If you don't, you'll
      get a bunch of PHP errors.
      See http://drupal.org/node/207252#comment-685906.
NOTE: When using a "multiple values" content_taxonomy CCK field, you must also
      set your vocabulary to be "multiple select"!
      See http://drupal.org/node/212398.

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


Author
------
Wim Leers

* mail: work@wimleers.com
* website: http://wimleers.com/work

The author can be contacted for paid customizations of this module as well as
Drupal consulting and development.
