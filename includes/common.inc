<?php
// $Id$

/**
 * @file
 * Functions used by more than one Hierarchical Select implementation.
 */

/**
 * Retrieve a config. If certain settings are not yet configured by the user,
 * defaults will be set. These defaults can also be overriden. This allows
 * modules to provide their own meaningful defaults.
 *
 * @param $config_id
 *   A config id, typically of the form "module-someid", e.g. "taxonomy-vid".
 * @param $defaults_override
 *   Optionally override the defaults.
 */
function hierarchical_select_common_config_get($config_id, $defaults_override = array()) {
  $config = variable_get('hs_config_'. $config_id, array());

  // Set defaults for unconfigured settings.
  $defaults = array(
    'config_id' => $config_id,
    'save_lineage'    => 0,
    'enforce_deepest' => 0,
    'node_count'      => 0,
    'level_labels' => array(
      'status' => 0,
    ),
    'dropbox' => array(
      'status' => 0,
    ),
    'editability' => array(
      'status'           => 0,
      'item_types'       => array(),
      'allow_new_levels' => 0,
      'max_levels'       => 3,
    ),
  );

  // Allow new defaults to be set.
  $defaults = array_smart_merge($defaults, $defaults_override);

  // Set defaults for settings not yet set in the configuration.
  $config += $defaults;

  return $config;
}

/**
 * Set a config.
 *
 * @param $config_id
 *   A config id.
 * @param $config
 *   The config to store.
 */
function hierarchical_select_common_config_set($config_id, $config) {
  variable_set('hs_config_'. $config_id, $config);
}

/**
 * Apply a config to a form item.
 *
 * @param $form_item
 *   The form item that will be updated.
 * @param $config_id
 *   A config id.
 * @param $defaults_override
 *   Optionally override the defaults.
 *   @see hierarchical_select_common_config_get()
 */
function hierarchical_select_common_config_apply(&$form_item, $config_id, $defaults_override = array()) {
  $config = hierarchical_select_common_config_get($config_id, $defaults_override);
  $form_item['#config'] = array_merge((is_array($form_item['#config'])) ? $form_item['#config'] : array(), $config);
}


//----------------------------------------------------------------------------
// Forms API callbacks.

/**
 * Form definition of the hierarchical_select_common_config_form form.
 */
function hierarchical_select_common_config_form($module, $params, $config_id, $defaults_override, $strings, $max_hierarchy_depth)  {
  static $js_added;
  
  if (!isset($js_added)) {
    $js_added = TRUE;
    drupal_add_css(drupal_get_path('module', 'hierarchical_select') .'/includes/common_config_form.css', 'module');
    drupal_add_js(drupal_get_path('module', 'hierarchical_select') .'/includes/common_config_form.js', 'module', 'header');
    drupal_add_js(array('HierarchicalSelect' => array('configForm' => array($config_id))), 'setting');
  }

  $config = hierarchical_select_common_config_get($config_id, $defaults_override);

  $form = array(
    '#tree' => TRUE,
    '#type' => 'fieldset',
    '#title' => t('Hierarchical Select configuration'),
    '#attributes' => array(
      'class' => 'hierarchical-select-config-form',
      'id'    => 'hierarchical-select-config-form-'. $config_id,
    ),
  );

  $form['config_id'] = array('#type' => 'value', '#value' => $config_id);

  // TODO: really make this a *live* preview, i.e. refresh the preview on each
  // change in the form. This cannot be done easily in Drupal 5, so let's do
  // so in Drupal 6. See cfg.livePreview in common_config_form.js.
  $form['live_preview'] = array(
    '#type' => 'fieldset',
    '#title' => t('Preview'),
    '#description' => t('This is what the Hierarchical Select will look like with your current configuration.'),
    '#collapsible' => FALSE,
    '#attributes' => array('class' => 'live-preview'),
  );
  $form['live_preview']['example'] = array(
    '#type' => 'hierarchical_select',
    '#title' => t('Preview'),
    '#description' => t('The description.'),
    // Skip all validation.
    '#validated' => TRUE,
  );
  hierarchical_select_common_config_apply($form['live_preview']['example'], $config_id, array('module' => $module, 'params' => $params));

  $form['save_lineage'] = array(
    '#type' => 'radios',
    '#title' => t('Save lineage'),
    '#options' => array(
      1 => t('Save !item lineage', array('!item' => $strings['item'])),
      0 => t('Save only the deepest !item', array('!item' => $strings['item'])),
    ),
    '#default_value' => $config['save_lineage'],
    '#description' => t(
      'Saving the !item lineage means saving the <em>the !item itself and all
      its ancestors</em>.',
      array('!item' => $strings['item'], '!hierarchy' => $strings['hierarchy'])
    ),
  );

  $form['enforce_deepest'] = array(
    '#type' => 'radios',
    '#title' => t('Level choice'),
    '#options' => array(
      1 => t('Force the user to choose a !item from a <em>deepest level</em>', array('!item' => $strings['item'])),
      0 => t('Allow the user to choose a !item from <em>any level</em>', array('!item' => $strings['item'])),
    ),
    '#default_value' => $config['enforce_deepest'],
    '#description' => t(
      'This setting determines from which level in the !hierarchy tree a
      user can select a !item.',
      array('!item' => $strings['item'], '!hierarchy' => $strings['hierarchy'])
    ),
    '#attributes' => array('class' => 'enforce-deepest'),
  );
  
  if (function_exists($module .'_hierarchical_select_node_count')) {
    $form['node_count'] = array(
      '#type' => 'radios',
      '#title' => t('Display the node count'),
      '#description' => t('When you enable this, the user will see the number of nodes that match the current !item listed between brackets.', array('!item' => $strings['item'])),
      '#options' => array(
        0 => t('Disabled'),
        1 => t('Enabled'),
      ),
      '#default_value' => $config['node_count'],
      '#attributes' => array('class' => 'node-counts'),
    );
  }

  $form['level_labels'] = array(
    '#tree' => TRUE,
    '#type' => 'fieldset',
    '#title' => t('Level labels'),
    '#description' => t(
      'When the user is allowed to choose a !item from any level in the
      <em>Level choice</em> setting, you can enter a level label for
      <em>each</em> level.<br />
      However, when the user is only allowed to choose a !item from the
      deepest level, then you can only enter a label for the <em>root</em>
      level.',
      array('!item' => $strings['item'])
    ),
    '#collapsible' => TRUE,
  );
  $form['level_labels']['status'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable level labels'),
    '#default_value' => $config['level_labels']['status'],
    '#attributes' => array('class' => 'level-labels-status'),
  );
  for ($depth = 0; $depth <= $max_hierarchy_depth; $depth++) {
    $form['level_labels']['labels'][$depth] = array(
      '#type' => 'textfield',
      '#title' => t(($depth == 0) ? 'Label for the root level' : 'Label for sublevel !depth', array('!depth' => $depth)),
      '#size' => 40,
      '#maxlength' => 255,
      '#default_value' => $config['level_labels']['labels'][$depth],
      '#attributes' => array('class' => 'level-label'),
    );
  }

  $form['dropbox'] = array(
    '#type' => 'fieldset',
    '#title' => t('Dropbox settings'),
    '#description' => t('The dropbox allows the user to <strong>make multiple selections</strong>.'),
    '#collapsible' => TRUE,
  );
  $form['dropbox']['status'] = array(
    '#type' => 'checkbox',
    '#title' => t('Enable the dropbox'),
    '#default_value' => $config['dropbox']['status'],
    '#attributes' => array('class' => 'dropbox-status'),
  );  
  $form['dropbox']['title'] = array(
    '#type' => 'textfield',
    '#title' => t('Title'),
    '#description' => t('The title you enter here appears above the dropbox.'),
    '#size' => 40,
    '#maxlength' => 255,
    '#default_value' => $config['dropbox']['title'],
    '#attributes' => array('class' => 'dropbox-title'),
  );
  $form['dropbox']['limit'] = array(
    '#type' => 'textfield',
    '#title' => t('Limit the number of selections'),
    '#description' => t(
      'Limits the number of selections that can be added to the dropbox.
      0 means no limit.
      <br />
      Note: the "Save !item lineage" option has no effect on this, even if
      a lineage consists of 3 !items, this will count as only one selection
      in the dropbox.',
      array('!item' => $strings['item'], '!items' => $strings['items'])
    ),
    '#size' => 5,
    '#maxlength' => 5,
    '#default_value' => $config['dropbox']['limit'],
    '#attributes' => array('class' => 'dropbox-limit'),
  );

  if (function_exists($module .'_hierarchical_select_create_item')) {
    $form['editability'] = array(
      '#type' => 'fieldset',
      '#title' => t('Editability settings'),
      '#description' => t(
        'You can allow the user to <strong>add new !items to this
        !hierarchy</strong> <em>through</em> Hierarchical Select.',
        array('!hierarchy' => $strings['hierarchy'], '!items' => $strings['items'])
      ),
      '#collapsible' => TRUE,
    );    
    $form['editability']['status'] = array(
      '#type' => 'checkbox',
      '#title' => t('Allow creation of new !items', array('!items' => $strings['items'])),
      '#options' => array(
        0 => t('Disabled'),
        1 => t('Enabled'),
      ),
      '#default_value' => $config['editability']['status'],
      '#attributes' => array('class' => 'editability-status'),
    );
    for ($depth = 0; $depth <= $max_hierarchy_depth; $depth++) {
      $form['editability']['item_types'][$depth] = array(
        '#type' => 'textfield',
        '#title' => t(($depth == 0) ? 'The !item_type for the root level' : 'The !item_type for sublevel !depth', array('!item_type' => $strings['item_type'], '!depth' => $depth)),
        '#size' => 20,
        '#maxlength' => 255,
        '#default_value' => $config['editability']['item_types'][$depth],
        '#attributes' => array('class' => 'editability-item-type'),
      );
    }
    $form['editability']['allow_new_levels'] = array(
      '#type' => 'checkbox',
      '#title' => t('Allow creation of new levels'),
      '#default_value' => $config['editability']['allow_new_levels'],
      '#description' => t(
        'Allow the user to create child !items for !items that do not yet have
        children.',
        array('!items' => $strings['items'])
      ),
      '#attributes' => array('class' => 'editability-allow-new-levels'),
    );
    $form['editability']['max_levels'] = array(
      '#type' => 'textfield',
      '#title' => t('Maximum number of levels allowed'),
      '#size' => 3  ,
      '#maxlength' => 255,
      '#default_value' => $config['editability']['max_levels'],
      '#description' => t(
        'When the user is allowed to create new levels, this option prevents
        the user from creating extremely deep !hierarchies.',
        array('!hierarchies' => $strings['hierarchies'])
      ),
      '#attributes' => array('class' => 'editability-max-levels'),
    );
  }

  return $form;
}

/**
 * Submit callback for the hierarchical_select_common_config_form form.
 */
function hierarchical_select_common_config_form_submit($form_id, $form_values, $parents) {
  $config = _hierarchical_select_get_form_element($form_values, $parents);

  // Don't include the value of the live preview in the config.
  unset($config['live_preview']);

  hierarchical_select_common_config_set($config['config_id'], $config);
}

/**
 * Helper function that adds the JS to reposition the exposed filters of a
 * View just once.
 */
function hierarchical_select_common_views_exposed_filters_reposition() {
  static $js_added;
  
  if (!isset($js_added)) {
    drupal_add_js(drupal_get_path('module', 'hierarchical_select') .'/includes/views.js', 'module');
  }
}


/**
 * Smarter version of array_merge_recursive: overwrites scalar values.
 *
 * From: http://www.php.net/manual/en/function.array-merge-recursive.php#82976.
 */
function array_smart_merge($array, $override) {
  if (is_array($array) && is_array($override)) {
    foreach ($override as $k => $v) {
      if (isset($array[$k]) && is_array($v) && is_array($array[$k])) {
        $array[$k] = array_smart_merge($array[$k], $v);
      }
      else {
        $array[$k] = $v;
      }
    }
  }
  return $array;
}
