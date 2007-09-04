<?php
// $Id$

//----------------------------------------------------------------------------
// Hierarchical Select hooks.

/**
 * Implementation of hook_hierarchical_select_form_alter().
 */
function taxonomy_hierarchical_select_form_alter($form_id, &$form) {
  // Change the exposed filters of Views. Only affects multiple hierarchy
  // vocabulary filters.
  if ($form_id == 'views_filters') {

    // Find the ids and vocabulary ids of the exposed filters.
    $filters = array();
    foreach ($form['view']['#value']->exposed_filter as $id => $filter) {
      if (preg_match("/term_node_(\d+)\.tid/", $filter['field'], $matches)) {
        $vid = $matches[1];
        $vocabulary = taxonomy_get_vocabulary($vid);

        if ($vocabulary->hierarchy > 0) {
          // Remove the "operator" select form item.
          unset($form["op$id"]);

          // Enforce the "Force single" option.
          $form['view']['#value']->exposed_filter[$id]['single'] = TRUE;
          $form['#parameters']->exposed_filter[$id]['single'] = TRUE;

          // Make it use a hierarchical select.
          $form["filter$id"]['#type'] = 'hierarchical_select';
          $form["filter$id"]['#hierarchical_select_settings'] = array(
            'module' => 'taxonomy',
            'params' => array(
              'vid' => $vid,
            ),
          );

          // Put the altered exposed filter in a separate table row.
          drupal_add_js(drupal_get_path('module', 'hierarchical_select') .'/modules/hierarchical_select_taxonomy.js', 'module');
        }
      }
    }
  }

  // Change the term selection of nodes. Only affects multiple hierarchy
  // vocabularies.
  if (isset($form['type']) && $form['type']['#value'] .'_node_form' == $form_id) {
    if (is_array($form['taxonomy'])) {
      foreach ($form['taxonomy'] as $vid => $form_item) {
        $vocabulary = taxonomy_get_vocabulary($vid);
        if ($vocabulary->hierarchy > 0 && !$form['taxonomy'][$vid]['#multiple']) {
          $form['taxonomy'][$vid]['#type'] = 'hierarchical_select';
          $form['taxonomy'][$vid]['#hierarchical_select_settings'] = array(
            'module' => 'taxonomy',
            'params' => array(
              'vid' => $vid,
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
function taxonomy_hierarchical_select_render($hsid, $selection, $params) {
  $output = '';

  $tid = $selection;
  $vid = $params['vid'];
  $depth = (isset($params['depth'])) ? $params['depth'] : 0; // Zero means full depth.

  // Check if the tid is valid (if it's a term in vocabulary with vid $vid).
  $term = taxonomy_get_term($tid);
  $tid = ($term->vid == $vid) ? $tid : -1;

  // Get all selected terms, from the highest level, down to the level of the
  // default term.
  $selected_terms = ($tid == -1) ? array() : array_reverse(taxonomy_get_parents_all($tid));
  $tid_level = count($selected_terms) - 1;

  // If the depth of the selected term is deeper than the allowed the depth,
  // reset the selected term to the default one.
  if ($depth > 0 && $tid_level + 1 > $depth) {
    $tid = -1;
    $selected_terms = array();
    $tid_level = -1;
  }

  // Store for every level:
  // - the tid of the term that is selected by default
  // - the taxonomy tree of that level, below the parent term
  foreach ($selected_terms as $level => $term) {
    $levels[$level]['term'] = $term->tid;
    $levels[$level]['tree'] = taxonomy_get_children(($level == 0) ? 0 : $levels[$level - 1]['term'], $vid);
  }

  // Get the levels below the deepest selected term, if it exists.
  $deepest_level = taxonomy_get_children(($tid_level > -1) ? $levels[$tid_level]['term'] : 0, $vid);
  $level = $tid_level + 1;
  while (count($deepest_level) && ($depth == 0 || ($depth > 0 && $level < $depth))) {
    $tids = array_keys($deepest_level);
    $levels[$level]['term'] = $tids[0];
    $levels[$level]['tree'] = $deepest_level;
    $deepest_level = taxonomy_get_children($levels[$level]['term'], $vid);
    $level++;
  }

  // Render it.
  $selects = array();
  for ($level = 0; $level < count($levels); $level++) {
    $selects[$level]['selected'] = $levels[$level]['term'];
    $selects[$level]['options'] = _taxonomy_hierarchical_select_terms_to_options($levels[$level]['tree']);
  }
  $output .= hierarchical_select_render_selects($hsid, $selects);

  return $output;
}


//----------------------------------------------------------------------------
// Private functions.

/**
 * Helper function to transform an array of terms into an associative array of
 * options, for use in a select form item.
 *
 * @param $terms
 *  An array of term objects.
 * @return
 *  An associative array of options, keys are tids, values are term names.
 */
function _taxonomy_hierarchical_select_terms_to_options($terms) {
  $options = array();
  foreach ($terms as $key => $term) {
    $options[$term->tid] = $term->name;
  }
  return $options;
}
