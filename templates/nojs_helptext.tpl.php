<noscript>
<span class="warning"><?php print t("You don't have Javascript enabled."); ?></span>
<span class="ask-to-hover"><?php print t('Hover for more information!'); ?></span>
<?php print t("But don't worry: you can still use this web site! You have two options:"); ?>
<?php if(isset($item_list)): ?>
  <?php print $item_list; ?>
<?php endif; ?>
</noscript>
