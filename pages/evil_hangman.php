<link rel="stylesheet" href="scripts/hangman.css" type="text/css">
<script type='text/javascript' src="scripts/hangman_brain.js"></script>

<img id=hangman_title src="images/evil_hangman/title.gif" width=550px height=100px/>

<script type='text/javascript'>
    var brain = new hangman_brain();
	var im = new Image();
	im.src = "images/evil_hangman/platform_6.gif";
	im.src = "images/evil_hangman/platform_5.gif";
	im.src = "images/evil_hangman/platform_4.gif";
	im.src = "images/evil_hangman/platform_3.gif";
	im.src = "images/evil_hangman/platform_2.gif";
	im.src = "images/evil_hangman/platform_1.gif";
	im.src = "images/evil_hangman/platform_0.gif";
	im.src = "images/evil_hangman/platform_win.gif";
	im.src = "images/evil_hangman/platform_loss.gif";
</script>

<div id=hangman_welcome>
	<input id=hangman_button_new_game class=hangman_button type=button value="Start the Execution" onClick="brain.initialize_game()" />
</div>

<div id=hangman_play>
	<img id=hangman_platform src="images/evil_hangman/platform_6.gif" width=200px height=200px/>
	<ul id=hangman_word><li>_</li></ul>
	<div id=hangman_controls>
		<input id=hangman_guess_box type=text size=1 maxlength=1 />
		<input id=hangman_button_guess class=hangman_button type=button value=guess onClick="brain.guess($('#hangman_guess_box').val());" />
		<span id=hangman_chances></span>
	</div>
	<div id=hangman_message></div>
	<div id=hangman_message_win>You survived. <input class=hangman_button type=button value="Play Again?" onClick="brain.initialize_game()" /></div>
	<div id=hangman_message_loss>You died. <input class=hangman_button type=button value="Play Again?" onClick="brain.initialize_game()" /></div>
</div>