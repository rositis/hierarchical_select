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
        taxonomy_hierarchical_select_update_form_item($form[$field_name]['tids'], $vid);
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
          taxonomy_hierarchical_select_update_form_item($form[$field_group][$field_name]['tids'], $vid);
        }
      }
    }
  }
}

/**
 * Implementation of hook_hierarchical_select_params().
 */
function content_taxonomy_hierarchical_select_params() {
  $params = array(
    'vid',
    'depth',
  );
  return $params;
}

/**
 * Implementation of hook_hierarchical_select_root_level().
 */
function content_taxonomy_hierarchical_select_root_level($params) {
  return taxonomy_hierarchical_select_root_level($params);
}

/**
 * Implementation of hook_hierarchical_select_children().
 */
function content_taxonomy_hierarchical_select_children($parent, $params) {
  $terms = taxonomy_get_tree($params['vid'], $parent, -1, $params['depth']);
  return _taxonomy_hierarchical_select_terms_to_options($terms);
}

/**
 * Implementation of hook_hierarchical_select_lineage().
 */
function content_taxonomy_hierarchical_select_lineage($item, $params) {
  return taxonomy_hierarchical_select_lineage($item, $params);
}

/**
 * Implementation of hook_hierarchical_select_valid_item().
 */
function content_taxonomy_hierarchical_select_valid_item($item, $params) {
  if (!is_numeric($item) || $item < 1) {
    return FALSE;
  }
  $term = taxonomy_get_term($item);
  return ($term->vid == $params['vid'] && $term->depth <= $params['depth']);
}

/**
 * Implementation of hook_hierarchical_select_item_get_label().
 */
function content_taxonomy_hierarchical_select_item_get_label($item, $params) {
  return taxonomy_hierarchical_select_item_get_label($item, $params);
}
