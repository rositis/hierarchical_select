<?php
// $Id$


define('HS_TAXONOMY_SINGLE_PARENT', 1);
define('HS_TAXONOMY_MULTIPLE_PARENTS', 2);
define('HS_TAXONOMY_DO_SAVE_LINEAGE', 1);
define('HS_TAXONOMY_DONT_SAVE_LINEAGE', 0);
define('HS_TAXONOMY_DO_ENFORCE_DEEPEST', 1);
define('HS_TAXONOMY_DONT_ENFORCE_DEEPEST', 0);
define('HS_TAXONOMY_DO_ADD_ALL_OPTION', 1);
define('HS_TAXONOMY_DONT_ADD_ALL_OPTION', 0);

//----------------------------------------------------------------------------
// Hierarchical Select hooks.

/**
 * Implementation of hook_hierarchical_select_form_alter().
 */
function taxonomy_hierarchical_select_form_alter($form_id, &$form) {
  // Add per-vocabulary settings for Hierarchical Select.
  if ($form_id == 'taxonomy_form_vocabulary') {
    $vid = $form['vid']['#value'];
    $first_part = array_slice($form, 0, 8);
    $second_part = array_slice($form, 8, 2);
    $third_part = array_slice($form, 10);
    $form = $first_part;

    // Hide Taxonomy's "multiple select" setting, create a similar setting
    // for Hierarchical Select.
    // Also see the comment in hierarchical_select_taxonomy_form_vocabulary_validate().
    $form['hierarchical_select_multiple'] = $form['multiple'];
    $form['hierarchical_select_multiple']['#default_value'] = variable_get("hierarchical_select_multiple_{$vid}", 0);
    $form['multiple']['#type'] = 'hidden';
    $form += $second_part;

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
        ancestors. This is enabled by default if the vocabulary has the
        multiple parents options enabled (otherwise it would try to
        reconstruct the lineage and possibly choose the wrong parent).'
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

    $form['hierarchical_select']['all_option'] = array(
      '#type' => ((bool) variable_get("hierarchical_select_multiple_{$vid}", 0)) ? 'select' : 'item',
      '#title' => t('Option to select all items at once'),
      '#description' => t(
        'After enabling this setting, a new "&lt;all&gt;" option will be
        prepended the root level select. By choosing this option, all items in
        the hierarchy will be selected at once.<br />This setting is only
        available if you\'ve enabled multiple select.'),
      '#options' => array(
        HS_TAXONOMY_DONT_ADD_ALL_OPTION => t('Disabled'),
        HS_TAXONOMY_DO_ADD_ALL_OPTION => t('Enabled'),
      ),
      '#default_value' => variable_get("hierarchical_select_all_option_$vid", HS_TAXONOMY_DONT_ADD_ALL_OPTION),
    );
    
    $form['hierarchical_select']['level_labels'] = array(
      '#tree' => TRUE,
      '#type' => 'fieldset',
      '#title' => t('Level labels'),
      '#description' => t(
        'When the user is allowed to choose a term from any level in the
        <em>Level choice</em> setting, you can enter a level label for each
        level.<br /> However, when the user is only allowed to choose a term
        from the deepest level, then you can enter only a label for the root
        level.'
      ),
      '#collapsible' => TRUE,
      '#collapsed' => FALSE,
    );

    $form['hierarchical_select']['level_labels']["level_0"] = array(
      '#type' => 'textfield',
      '#title' => t('Label for root level'),
      '#size' => 40,
      '#maxlength' => 255,
      '#default_value' => variable_get("hierarchical_select_level_0_{$vid}", ''),
    );

    if ($enforce_deepest == HS_TAXONOMY_DONT_ENFORCE_DEEPEST) {
      // Create an option for each level in the hierarchy.
      for ($depth = 1; $depth <= _taxonomy_hierarchical_select_get_depth($vid); $depth++) {
        $form['hierarchical_select']['level_labels']["level_$depth"] = array(
          '#type' => 'textfield',
          '#title' => t('Label for sublevel !depth', array('!depth' => $depth)),
          '#size' => 40,
          '#maxlength' => 255,
          '#default_value' => variable_get("hierarchical_select_level_{$depth}_{$vid}", ''),
        );
      }
    }

    $form['hierarchical_select']['dropbox'] = array(
      '#type' => 'fieldset',
      '#title' => t('Dropbox settings'),
      '#description' => t(
        'The dropbox is the area where all selected items are displayed when
        multiple select is enabled.'
      ),
      '#collapsible' => TRUE,
      '#collapsed' => FALSE,
    );

    if ($form['hierarchical_select_multiple']['#default_value']) {
      $form['hierarchical_select']['dropbox']['dropbox_title'] = array(
        '#type' => 'textfield',
        '#title' => t('Title'),
        '#description' => t('The title you enter here appears above the dropbox.'),
        '#size' => 40,
        '#maxlength' => 255,
        '#default_value' => variable_get("hierarchical_select_dropbox_title_{$vid}", ''),
      );
      $form['hierarchical_select']['dropbox']['dropbox_limit'] = array(
        '#type' => 'textfield',
        '#title' => t('Limit the number of selections'),
        '#description' => t(
          'Limits the number of selections that can be added to the dropbox.
          0 means no limit.
          <br />
          Note: the "Save term lineage" option has no effect on this, even if
          a lineage consists of 3 terms, this will count as only one selection
          in the dropbox.'),
        '#size' => 5,
        '#maxlength' => 5,
        '#default_value' => variable_get("hierarchical_select_dropbox_limit_{$vid}", 0),
      );
      
    }

    $form['#submit']['taxonomy_form_vocabulary_submit'] = array(); // Make sure the original submit handler is still called.
    $form['#validate']['hierarchical_select_taxonomy_form_vocabulary_validate'] = array();
    $form['#submit']['hierarchical_select_taxonomy_form_vocabulary_submit'] = array();
    $form += $third_part;
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
          $view = $form['view']['#value'];

          // Hierarchical Select only makes sense if there's a hierarchy.
          if ($vocabulary->hierarchy > 0) {
            // Make it use a hierarchical select.
            $form["filter$id"]['#type'] = 'hierarchical_select';
            $form["filter$id"]['#hierarchical_select_settings'] = array(
              'module' => 'taxonomy',
              'params' => array(
                'vid' => $vid,
              ),
            );
            taxonomy_hierarchical_select_update_form_item($form["filter$id"], $vid);
            
            // Inherit #multiple from the exposed filter settings.
            $form["filter$id"]['#multiple'] = !((bool) $view->exposed_filter[$id]['single']);
            
            // Inherit #required from the exposed filter settings.
            $form["filter$id"]['#required'] = !((bool) $view->exposed_filter[$id]['optional']);
          
            // Remove the dropbox limit.
            unset($form["filter$id"]['#hierarchical_select_settings']['dropbox_limit']);

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
          $form['taxonomy'][$vid]['#type'] = 'hierarchical_select';
          $form['taxonomy'][$vid]['#hierarchical_select_settings'] = array(
            'module' => 'taxonomy',
            'params' => array(
              'vid' => $vid,
            ),
          );
          taxonomy_hierarchical_select_update_form_item($form['taxonomy'][$vid], $vid);
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

/**
 * Implementation of hook_hierarchical_select_item_get_label().
 */
function taxonomy_hierarchical_select_item_get_label($item, $params) {
  static $labels = array();
  
  if (!isset($labels[$item])) {
    $term = taxonomy_get_term($item);
    $labels[$item] = $term->name;
  }

  return $labels[$item];
}

 
//----------------------------------------------------------------------------
// FAPI callbacks.

/**
 * Additional validate handler for the taxonomy_form_vocabulary form.
 */
function hierarchical_select_taxonomy_form_vocabulary_validate($form_id, $form_values, $form) {
  // Enable Taxonomy's "multiple select" setting when:
  // - Hierarchical Select's "multiple select" setting is enabled
  // - Hierarchical Select's "save term lineage" setting is enabled
  $multiple_select_enabled = ($form_values['hierarchical_select_multiple'] || _taxonomy_hierarchical_select_get_save_linage($form_values['vid']));
  form_set_value($form['multiple'], (int) $multiple_select_enabled);
}

/**
 * Additional submit handler for the taxonomy_form_vocabulary form.
 */
function hierarchical_select_taxonomy_form_vocabulary_submit($form_id, $form_values) {
  $vid = $form_values['vid'];
  $settings = array('status', 'save_lineage', 'enforce_deepest', 'all_option');
  variable_set("hierarchical_select_multiple_{$vid}", $form_values['hierarchical_select_multiple']);
  foreach ($settings as $setting) {
    variable_set("hierarchical_select_{$setting}_{$vid}", $form_values['hierarchical_select'][$setting]);
  }
  if (isset($form_values['hierarchical_select']['level_labels'])) {
    foreach ($form_values['hierarchical_select']['level_labels'] as $setting => $value) {
      variable_set("hierarchical_select_{$setting}_{$vid}", $value);
    }
  }
  if (isset($form_values['hierarchical_select']['dropbox'])) {
    foreach ($form_values['hierarchical_select']['dropbox'] as $setting => $value) {
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


/**
 * Sets certain Hierarchical Select settings, based on the vid. The user can
 * configure this on the vocabulary administration page, this function applies
 * those settings.
 *
 * @param $form_item
 *   The form item to update.
 * @param $vid
 *   The id of the vocabulary of which the settings should be applied.
 */
function taxonomy_hierarchical_select_update_form_item(&$form_item, $vid) {
  $enforce_deepest = variable_get("hierarchical_select_enforce_deepest_$vid", HS_TAXONOMY_DONT_ENFORCE_DEEPEST);

  $form_item['#multiple'] = variable_get("hierarchical_select_multiple_{$vid}", 0);
  $form_item['#hierarchical_select_settings']['save_lineage'] = _taxonomy_hierarchical_select_get_save_linage($vid);
  $form_item['#hierarchical_select_settings']['enforce_deepest'] = $enforce_deepest;
  $form_item['#hierarchical_select_settings']['all_option'] = (bool) variable_get("hierarchical_select_all_option_$vid", HS_TAXONOMY_DONT_ADD_ALL_OPTION);
  // Always get the root level label.
  $form_item['#hierarchical_select_settings']['level_labels'][0] = variable_get("hierarchical_select_level_0_{$vid}", '');
  if ($enforce_deepest == HS_TAXONOMY_DONT_ENFORCE_DEEPEST) {
    for ($depth = 1; $depth <= _taxonomy_hierarchical_select_get_depth($vid); $depth++) {
      $form_item['#hierarchical_select_settings']['level_labels'][$depth] = variable_get("hierarchical_select_level_{$depth}_{$vid}", '');
    }
  }
  $form_item['#hierarchical_select_settings']['dropbox_title'] = variable_get("hierarchical_select_dropbox_title_{$vid}", '');
  $form_item['#hierarchical_select_settings']['dropbox_limit'] = variable_get("hierarchical_select_dropbox_limit_{$vid}", 0);
}
