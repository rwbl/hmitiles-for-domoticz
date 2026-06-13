# LogMonitor Hints

## Hide Elements
Do not remove elements from the HTMl definition, but **hide** them.
Add 
```
style="display: none;"
```
Example:
```
<!-- The input field and send button are hidden. Do not remove. -->
<div class="hmi-log-input-row" style="justify-content: flex-end;">
	<input type="text" class="hmi-log-input" placeholder="Type custom log message..." maxlength="100" style="display: none;">
	<button class="hmi-log-send-btn" style="display: none;">SEND</button>
	<button class="hmi-log-clear-btn">CLEAR</button>
</div>
```

## Log Filter
The `data-log-filter` is case-sensitive.
Example:
```
<div class="hmi-pack-card" data-type="log-monitor" data-log-limit="8" data-log-prefix="[HMI Dashboard]" data-log-filter="[PicoServoControl]">
```

## Log Prefix
The `data-log-prefix` is used by the Input field.
