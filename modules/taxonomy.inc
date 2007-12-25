<?php
// $Id$


define('HS_TAXONOMY_SINGLE_PARENT', 1);
define('HS_TAXONOMY_MULTIPLE_PARENTS', 2);
define('HS_TAXONOMY_DO_SAVE_LINEAGE', 1);
define('HS_TAXONOMY_DONT_SAVE_LINEAGE', 0);
define('HS_TAXONOMY_DO_ENFORCE_DEEPEST', 1);
define('HS_TAXONOMY_DONT_ENFORCE_DEEPEST', 0);

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
    $form['hierarchical_select']['status'] = array(
      '#type' => 'checkbox',
      '#title' => t('Use the Hierarchical Select form element for this vocabulary'),
      '#default_value' => variable_get("hierarchical_select_status_$vid", FALSE),
    );

    $form['hierarchical_select']['save_lineage'] = array(
      '#type' => 'select',
      '#title' => t('Save lineage'),
      '#options' => array(
        HS_TAXONOMY_DO_SAVE_LINEAGE => t('Save term lineage'),
        HS_TAXONOMY_DONT_SAVE_LINEAGE => t('Save only the deepest term'),
      ),
      '#default_value' => _taxonomy_hierarchical_select_get_save_linage($vid),
      '#description' => t(
        'Saving the term lineage means saving the the term itself and all its
        ancestors. This is enabled by default and recommended if the
        vocabulary has the multiple parents options enabled.'
      ),
    );

    $enforce_deepest = variable_get("hierarchical_select_enforce_deepest_$vid", HS_TAXONOMY_DONT_ENFORCE_DEEPEST);
    $form['hierarchical_select']['enforce_deepest'] = array(
      '#type' => 'select',
      '#title' => t('Level choice'),
      '#options' => array(
        HS_TAXONOMY_DO_ENFORCE_DEEPEST => t('Force the user to choose a term from the deepest level'),
        HS_TAXONOMY_DONT_ENFORCE_DEEPEST => t('Allow the user to choose a term from any level'),
      ),
      '#default_value' => $enforce_deepest,
      '#description' => t(
        'This setting determines from which level in the vocabulary tree a
        user can select a term. Either you can force the user to choose from
        the deepest level (based on what has been selected before, this does
        not mean that every branch in your vocabulary tree must be equally
        deep), or from any level.'
      ),
    );

    $form['hierarchical_select']['level_labels'] = array(
      '#tree' => TRUE,
      '#type' => 'fieldset',
      '#title' => t('Level labels'),
      '#description' => ($enforce_deepest == HS_TAXONOMY_DONT_ENFORCE_DEEPEST) ? NULL : t(
        'The user must be allowed to choose from any level in the <em>Level
        choice</em> setting to enable level labels.'
      ),
      '#collapsible' => TRUE,
      '#collapsed' => FALSE,
    );

    if ($enforce_deepest == HS_TAXONOMY_DONT_ENFORCE_DEEPEST) {
      // Create an option for each level in the hierarchy.
      for ($depth = 0; $depth <= _taxonomy_hierarchical_select_get_depth($vid); $depth++) {
        $form['hierarchical_select']['level_labels']["level_$depth"] = array(
          '#type' => 'textfield',
          '#title' => t('Label for level !depth', array('!depth' => $depth)),
          '#size' => 40,
          '#maxlength' => 255,
          '#default_value' => variable_get("hierarchical_select_level_{$depth}_{$vid}", ''),
        );
      }
    }

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

  // Change the term selection of nodes. Only affects hierarchical
  // vocabularies.
  if (isset($form['type']) && $form['type']['#value'] .'_node_form' == $form_id && is_array($form['taxonomy'])) {
    foreach ($form['taxonomy'] as $vid => $form_item) {

      // Only apply Hierarchical Select if it's enabled for this vocabulary.
      if (variable_get("hierarchical_select_status_$vid", FALSE)) {
        $vocabulary = taxonomy_get_vocabulary($vid);

        // Hierarchical Select only makes sense if there's a hierarchy.
        if ($vocabulary->hierarchy > 0) {
          $enforce_deepest = variable_get("hierarchical_select_enforce_deepest_$vid", HS_TAXONOMY_DONT_ENFORCE_DEEPEST);

          $form['taxonomy'][$vid]['#type'] = 'hierarchical_select';
          $form['taxonomy'][$vid]['#hierarchical_select_settings'] = array(
            'save_lineage' => _taxonomy_hierarchical_select_get_save_linage($vid),
            'enforce_deepest' => $enforce_deepest,
            'module' => 'taxonomy',
            'params' => array(
              'vid' => $vid,
            ),
          );
          if ($enforce_deepest == HS_TAXONOMY_DONT_ENFORCE_DEEPEST) {
            $max_depth = _taxonomy_hierarchical_select_get_depth($vid);
            for ($depth = 0; $depth <= _taxonomy_hierarchical_select_get_depth($vid); $depth++) {
              $form['taxonomy'][$vid]['#hierarchical_select_settings']['level_labels'][$depth] = variable_get("hierarchical_select_level_{$depth}_{$vid}", '');
            }
          }
        }
      }
    }
  }
}

/**
 * Implementation of hook_hierarchical_select_params().
 */
function taxonomy_hierarchical_select_params() {
  $params = array(
    'vid',
  );
  return $params;
}

/**
 * Implementation of hook_hierarchical_select_root_level().
 */
function taxonomy_hierarchical_select_root_level($params) {
  $terms = taxonomy_get_tree($params['vid'], 0, -1, 1);
  return _taxonomy_hierarchical_select_terms_to_options($terms);
}

/**
 * Implementation of hook_hierarchical_select_children().
 */
function taxonomy_hierarchical_select_children($parent, $params) {
  $terms = taxonomy_get_children($parent, $params['vid']);
  return _taxonomy_hierarchical_select_terms_to_options($terms);
}

/**
 * Implementation of hook_hierarchical_select_lineage().
 */
function taxonomy_hierarchical_select_lineage($item, $params) {
  $lineage = array();

  $terms = array_reverse(taxonomy_get_parents_all($item));
  foreach ($terms as $term) {
    $lineage[] = $term->tid;
  }
  return $lineage;
}

/**
 * Implementation of hook_hierarchical_select_valid_item().
 */
function taxonomy_hierarchical_select_valid_item($item, $params) {
  if (!is_numeric($item) || $item < 1) {
    return FALSE;
  }
  $term = taxonomy_get_term($item);
  return ($term->vid == $params['vid']);
}

 
//----------------------------------------------------------------------------
// FAPI callbacks.

/**
 * Additional submit handler for the taxonomy_form_vocabulary form.
 */
function hierarchical_select_taxonomy_form_vocabulary_submit($form_id, $form_values) {
  $vid = $form_values['vid'];
  $settings = array('status', 'save_lineage', 'enforce_deepest');
  foreach ($settings as $setting) {
    variable_set("hierarchical_select_{$setting}_{$vid}", $form_values['hierarchical_select'][$setting]);
  }
  if (isset($form_values['hierarchical_select']['level_labels'])) {
    foreach ($form_values['hierarchical_select']['level_labels'] as $setting => $value) {
      variable_set("hierarchical_select_{$setting}_{$vid}", $value);
    }
  }
}


//----------------------------------------------------------------------------
// Private functions.

/**
 * Transform an array of terms into an associative array of options, for use
 * in a select form item.
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


/**
 * Get the save lineage setting for a vocabulary, but use a smart default.
 *
 * @param $vid
 *   A vocabulary id.
 * @return
 *   The save lineage setting.
 */
function _taxonomy_hierarchical_select_get_save_linage($vid) {
  // Determine the default based on the type of hierarchy: single (1) or
  // multiple parents (2). The latter has the "Save lineage" option enabled
  // by default.
  $vocabulary = taxonomy_get_vocabulary($vid);
  $save_lineage_default = ($vocabulary->hierarchy == HS_TAXONOMY_MULTIPLE_PARENTS) ? HS_TAXONOMY_DO_SAVE_LINEAGE : HS_TAXONOMY_DONT_SAVE_LINEAGE;

  return variable_get("hierarchical_select_save_lineage_$vid", $save_lineage_default);
}

/**
 * Get the depth of a vocabulary's tree.
 *
 * @param $vid
 *   A vocabulary id.
 * @return
 *   The depth of the vocabulary's tree.
 */
function _taxonomy_hierarchical_select_get_depth($vid) {
  $tree = taxonomy_get_tree($vid);
  foreach ($tree as $term) {
    if ($term->depth > $depth) {
      $depth = $term->depth;
    }
  }
  return $depth;
}
