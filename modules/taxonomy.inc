<?php
// $Id$

//----------------------------------------------------------------------------
// Hierarchical Select hooks.

/**
 * Implementation of hook_hierarchical_select_form_alter().
 */
function taxonomy_hierarchical_select_form_alter($form_id, &$form) {
  // Add per-vocabulary settings for Hierarchical Select.
  if ($form_id == 'taxonomy_form_vocabulary') {
    $vid = $form['vid']['#value'];
    $first_part = array_slice($form, 0, 9);
    $second_part = array_slice($form, 10);
    $form = $first_part;

    $form['hierarchical_select'] = array(
      '#tree' => TRUE,
      '#type' => 'fieldset',
      '#title' => t('Hierarchical Select settings'),
    );
    $form['hierarchical_select']['hierarchical_select_status'] = array(
      '#type' => 'checkbox',
      '#title' => t('Use the Hierarchical Select form element for this vocabulary'),
      '#default_value' => variable_get("hierarchical_select_status_$vid", FALSE),
    );
    
    $form['hierarchical_select']['hierarchical_select_lineage'] = array(
      '#type' => 'select',
      '#title' => t('Lineage'),
      '#options' => array(
        TRUE => t('Save term lineage'),
        FALSE => t('Save only the deepest term'),
      ),
      '#default_value' => variable_get("hierarchical_select_lineage_$vid", FALSE),
      '#description' => t(
        'Saving the term lineage means saving the entire the term itself and
        all its ancestors.'
      ),
    );
    $form['#submit']['taxonomy_form_vocabulary_submit'] = array(); // Make sure the original submit handler is still called.
    $form['#submit']['hierarchical_select_taxonomy_form_vocabulary_submit'] = array();
    $form += $second_part;
  }

  // Change the exposed filters of Views. Only affects hierarchical vocabulary
  // filters.
  if ($form_id == 'views_filters') {

    // Find the ids and vocabulary ids of the exposed filters.
    $filters = array();
    foreach ($form['view']['#value']->exposed_filter as $id => $filter) {
      if (preg_match("/term_node_(\d+)\.tid/", $filter['field'], $matches)) {
        $vid = $matches[1];
        
        // Only apply Hierarchical Select if it's enabled for this vocabulary.
        if (variable_get("hierarchical_select_status_$vid", FALSE)) {
          $vocabulary = taxonomy_get_vocabulary($vid);

          // Hierarchical Select only makes sense if there's a hierarchy.
          if ($vocabulary->hierarchy > 0) {
            // Remove the "operator" select form item.
            unset($form["op$id"]);

            // Enforce the "Force single" option.
            $form['view']['#value']->exposed_filter[$id]['single'] = TRUE;
            $form['#parameters']->exposed_filter[$id]['single'] = TRUE;

            // Make it use a hierarchical select.
            $form["filter$id"]['#type'] = 'hierarchical_select';
            $form["filter$id"]['#hierarchical_select_settings'] = array(
              'lineage' => variable_get("hierarchical_select_lineage_$vid", FALSE),
              'module' => 'taxonomy',
              'params' => array(
                'vid' => $vid,
              ),
            );

            // Put the altered exposed filters in a separate table row.
            _hierarchical_select_views_exposed_filters_reposition();
          }
        }
      }
    }
  }

  // Change the term selection of nodes. Only affects multiple hierarchical
  // vocabularies.
  if (isset($form['type']) && $form['type']['#value'] .'_node_form' == $form_id && is_array($form['taxonomy'])) {
    foreach ($form['taxonomy'] as $vid => $form_item) {

      // Only apply Hierarchical Select if it's enabled for this vocabulary.
      if (variable_get("hierarchical_select_status_$vid", FALSE)) {
        $vocabulary = taxonomy_get_vocabulary($vid);

        // Hierarchical Select only makes sense if there's a hierarchy.
        if ($vocabulary->hierarchy > 0) {
          $form['taxonomy'][$vid]['#type'] = 'hierarchical_select';
          $form['taxonomy'][$vid]['#hierarchical_select_settings'] = array(
            'lineage' => variable_get("hierarchical_select_lineage_$vid", FALSE),
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
function taxonomy_hierarchical_select_render($hsid, $selection, $params, $required = FALSE) {
  $output = '';

  $tid = $selection;
  $vid = $params['vid'];
  $depth = (isset($params['depth'])) ? $params['depth'] : 0; // Zero means full depth.

  // Initialize the "none" dummy term (will be used when rendering an optional
  // form item).
  $noneterm = new StdClass();
  $noneterm->tid = 'none';
  $noneterm->name = '<'. t('none') . '>';

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
    $levels[$level]['tree'] = ($term->tid == 0) ? array() : taxonomy_get_children(($level == 0) ? 0 : $levels[$level - 1]['term'], $vid);
  }

  // Set the selected term to "<none>" and render *just the first level*, if:
  // - no valid tid was specified
  // - the form item is not required
  if ($tid == -1 && !$required) {
    $levels[0]['term'] = 'none';
    $levels[0]['tree'] = array($noneterm);
    $levels[0]['tree'] += taxonomy_get_children(0, $vid);
  }
  else {
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

    // If this form item is not required, add a "<none>" as the first option
    // of the first level.
    if (!$required) {
      $rest_of_first_level = $levels[0]['tree'];
      $levels[0]['tree'] = array($noneterm);
      $levels[0]['tree'] += $rest_of_first_level;
    }
  }

  // Put our tree in a format the hierarchical_select_render_selects()
  // function can understand.
  $selects = array();
  for ($level = 0; $level < count($levels); $level++) {
    $selects[$level]['selected'] = $levels[$level]['term'];
    $selects[$level]['options'] = _taxonomy_hierarchical_select_terms_to_options($levels[$level]['tree']);
  }

  $output .= hierarchical_select_render_selects($hsid, $selects);

  return $output;
}


//----------------------------------------------------------------------------
// FAPI callbacks.

/**
 * Additional submit handler for the taxonomy_form_vocabulary form.
 */
function hierarchical_select_taxonomy_form_vocabulary_submit($form_id, $form_values) {
  $vid = $form_values['vid'];
  foreach ($form_values['hierarchical_select'] as $setting => $value) {
    variable_set("{$setting}_{$vid}", $value);
  }
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
