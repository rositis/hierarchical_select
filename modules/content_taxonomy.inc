<?php
// $Id$

//----------------------------------------------------------------------------
// Hierarchical Select hooks.

/**
 * Implementation of hook_hierarchical_select_form_alter().
 */
function content_taxonomy_hierarchical_select_form_alter($form_id, &$form) {
  // Change the term selection of nodes. Only affects multiple hierarchy
  // vocabularies. The select widget must be used.
  if (isset($form['type']) && $form['type']['#value'] .'_node_form' == $form_id) {
    $content_type = $form['type']['#value'];
    $fields = content_fields(NULL, $content_type);
    $hs_fields = array();

    foreach ($fields as $field_name => $field_properties) {
      if ($field_properties['type_name'] == $content_type) {
        $vid = $field_properties['vid'];
        $depth = $field_properties['depth'];

        // Hierarchical Select only makes sense if there's a hierarchy.
        if ($depth != 1) {

          // Only apply Hierarchical Select if it's enabled for this vocabulary.
          if (variable_get("hierarchical_select_status_$vid", FALSE)) {
            $vocabulary = taxonomy_get_vocabulary($vid);
            if ($vocabulary->hierarchy > 0) {
              $hs_fields[$field_name]['vid'] = $vid;
              $hs_fields[$field_name]['depth'] = $depth;
            }
          }
        }
      }
    }

    foreach ($hs_fields as $field_name => $field_properties) {
      $vid = $field_properties['vid'];
      $depth = $field_properties['depth'];

      // Check if the form element is at the root, the select widget must be
      // used and it cannot be a multiple select.
      if (isset($form[$field_name]) && $form[$field_name]['tids']['#type'] == 'select' && !$form[$field_name]['tids']['#multiple']) {
        $form[$field_name]['tids']['#type'] = 'hierarchical_select';
        $form[$field_name]['tids']['#hierarchical_select_settings'] = array(
          'module' => 'content_taxonomy',
          'params' => array(
            'vid' => $vid,
            'depth' => $depth,
          ),
        );
      }
      // Check if the form element is in a fieldgroup, the select widget must
      // be used and it cannot be a multiple select.
      elseif (module_exists('fieldgroup')) {
        $field_group = fieldgroup_get_group($content_type, $field_name);
        if (isset($form[$field_group][$field_name]) && $form[$field_group][$field_name]['tids']['#type'] == 'select' && !$form[$field_group][$field_name]['tids']['#multiple']) {
          $form[$field_group][$field_name]['tids']['#type'] = 'hierarchical_select';
          $form[$field_group][$field_name]['tids']['#hierarchical_select_settings'] = array(
            'module' => 'content_taxonomy',
            'params' => array(
              'vid' => $vid,
              'depth' => $depth,
            ),
          );
        }
      }
    }
  }
}

/**
 * Implementation of hook_hierarchical_select_render().
 */
function content_taxonomy_hierarchical_select_render($hsid, $selection, $params) {
  return taxonomy_hierarchical_select_render($hsid, $selection, $params);
}
