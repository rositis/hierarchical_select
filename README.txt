$Id$

Description
-----------
This module defines the "hierarchical_select" form element, which is a greatly
enhanced way for letting the user select an option in a hierarchy. Out of the
box, this module supports the taxonomy and content_taxonomy modules, but that
automatically includes the forum module. It also converts any hierarchical
taxonomny exposed filters in any View to a hierarchical select.

Any module that uses a select form element, of which the options are ordered
hierarchically, can take advantage of this new form element. Especially when
there's a deep hierarchy, or when there are a lot of options in each sublevel,
this form element greatly simplifies the finding of the right setting for the
user. Note that due to the nature of this custom form item, it's currently
impossible to select nothing. So by design, it is a required form item!


Dependencies
------------
* jQuery Interface (http://drupal.org/project/jquery_interface)


Installation
------------
1) Place this module directory in your modules folder (this will usually be
"sites/all/modules/").

2) Enable the module.


Sponsors
--------
Initial development:
  Paul Ektov of http://autobin.ru.
Abstraction, to let other modules than taxonomy hook in:
  Etienne Leers of http://creditcalc.biz.


Author
------
Wim Leers

* mail: work@wimleers.com
* website: http://wimleers.com/work

The author can be contacted for paid customizations of this module as well as
Drupal consulting, development and installation.
