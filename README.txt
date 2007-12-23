$Id$

Description
-----------
This module defines the "hierarchical_select" form element, which is a much
enhanced way for letting the user select an option in a hierarchy. Out of the
box, this module implements the hierarchical_select hooks for the taxonomy
(which automatically includes support for the forum module) and
content_taxonomy modules. It also converts hierarchical vocabularies that are
used as exposed filters in any View to a hierarchical select.

Any module that uses a select form element, of which the options are ordered
hierarchically, can take advantage of this new form element. Especially when
there's a deep hierarchy, or when there are a lot of options in each sublevel,
this form element greatly simplifies the user's search for the right option. 
Optional form elements can be used. Hierarchical Select can be configured per
vocabulary: it can be turned on/off and you can choose to save the entire term
lineage or only the deepest term.


Dependencies
------------
* jQuery Interface (http://drupal.org/project/jquery_interface)
  * jQuery Update (http://drupal.org/project/jquery_update)


Integrates with
---------------
* Taxonomy (Drupal core)
* Content Taxonomy (http://drupal.org/project/content_taxonomy)
* Views (http://drupal.org/project/views)


Installation
------------
1) Place this module directory in your modules folder (this will usually be
"sites/all/modules/").

2) Install the modules it depends on. Don't forget to copy the jquery.js file
included in the jQuery Update module to the "misc" directory!

3) Enable the module. All changes are applied automagically.

In case of problems, don't forget to do a hard refresh in your browser!


Sponsors
--------
* Initial development:
    Paul Ektov of http://autobin.ru.
* Abstraction, to let other modules than taxonomy hook in:
    Etienne Leers of http://creditcalc.biz.
* Support for saving the term lineage:
    Paul Ektov of http://autobin.ru.


Author
------
Wim Leers

* mail: work@wimleers.com
* website: http://wimleers.com/work

The author can be contacted for paid customizations of this module as well as
Drupal consulting, development and installation.
