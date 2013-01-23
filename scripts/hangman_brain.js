function hangman_brain(){
    //console.log('hangman_brain: The Hangman Awakens!');

	var gameState = [];

	this.initialize_game = function(){
		/* Passes the initialization request to the model function,
		initialize_game(), and then retrieves the returned game state values.
		Also instantiates gameState.activeWord as a string of underscores the
		same length as value of gameState.wordLength, then calls update_view().*/
        //console.log('initialize_game: sending initialization request');
		// Toggle displays
		$('#hangman_welcome').css('display', 'none');
		$('#hangman_message_loss').css('display', 'none');
		$('#hangman_message_win').css('display', 'none');
		$('#hangman_controls').css('display', 'none');
		$('#hangman_play').css('display', 'block');
		$('#hangman_message').html("...Please wait while I think of a word...");

		$.getJSON('scripts/hangman_model.php?initialize_game=', function(data){
			gameState = data;
			var blanks = [];
			for(var i = 0; i < gameState.wordLength; i++) blanks[i] = '_';
			gameState.activeWord = blanks.join('');
			gameState.eqClass = [];
			$('#hangman_guess_box').keyup(function(event){
				if(event.keyCode == 13) $('#hangman_button_guess').click();
			});
			$('#hangman_controls').css('display', 'block');
			$('#hangman_message').html("");
			update_view();
			//console.log('initialize_game: gameState.gameId = '+gameState.gameId);
			//console.log('initialize_game: gameState.words.length = '+gameState.words.length);
			//console.log('initialize_game: gameState.activeWord = '+gameState.activeWord);
		});
	};

    this.guess = function(letter){
		/* Called when the player submits a guess via the view. Calls
		gen_eq_classes() to generate gameState.eqClass[], then calls
		select_eq_class() to select the class that has been decided as the most
		evil. Next it calls update_word_list() to update gameState.words[] so
		that it is reduced to only contain members of the selected equivalency
		class. At the very end, it also calls update_view() to bring the view
		in sync with the current game state. */
        $('#hangman_message').html("");						// Clear the message division
		//console.log(' ');									// Create a blank for a tidy console.log
		if(!is_valid_guess(letter)) return;					// Only continue with game if letter is a valid guess
        gen_eq_classes(letter);								// Generate the eqClass counts given the letter
		var selectedHash = select_eq_class();				// Determine which class to go commit to.
		//console.log('guess: selectedHash = '+selectedHash); // Announce what the selected class is.
		if(selectedHash == '0'){ gameState.chances--;		// Decrement guesses left if class chosen was '0'
		}else{												//
			var pattern = new RegExp(letter+"+","i");		// Create pattern to check if activeWord has the
			if(pattern.test(gameState.activeWord))			//// letter guessed. If it does,
				gameState.chances--;						//// decrement guesses left
		}
		if(gameState.chances < 0){							// End the game if player's guess allowance is 0
			end_game('outOfChances'); return;				//// and the last guess resulted in hash = '0'.
		}													//// Immeadiately leave function upon losing.
        update_word_list(selectedHash, letter);				// Fully commit to the eqClass by updating the word list
		update_active_word(selectedHash, letter);           // Update the active word given the selected hash
		var pattern = /_+/;									// Create pattern to check if activeWord has any
		if(!pattern.test(gameState.activeWord)){			//// remaining '_'. If not, the player wins/
			end_game('win'); return;						////
		}update_view();										// Update the view given the new game state.
    };

	function is_valid_guess(val){
		/* Returns a Boolean indicating the validation of the letter delivered
		to guess(). When negative, it will immediately terminate execution of
		guess(), alert the player to an improper input, then remind him/her of
		the rules regarding proper guesses. Only when is_valid_guess() is
		positive will the rest of guess() be executed.*/
		var valid = 0;
		if(val.length == '')
			$('#hangman_message').html("Please enter a letter in the box to make a guess.");
		else if(val.length > 1)
			$('#hangman_message').html("Error, your guess must be only a single letter at a time.<br \>Please guess again.");
		else{
			pattern = /[^a-zA-Z]/;
			if(pattern.test(val))
				$('#hangman_message').html("Only letters between \'a\' and \'z\' are allowed as valid guesses.");
			else valid = true;
		}
		return valid;
	}

	function end_game(status){
		/* Requires a single parameter, a value that indicates which message to
		send to the view; ‘win’ for congratulations, anything else for a cheeky
		message. This function does that by first clearing the game state, then
		updating #hangman_message. */
		gameState = '';
		$('#hangman_controls').css('display', 'none');
        if(status == 'win'){
			// Toggle displays given win end state
			$('#hangman_message_loss').css('display', 'none');
			$('#hangman_message_win').css('display', 'block');
			$('#hangman_platform').attr('src', "images/evil_hangman/platform_win.gif");
		}else{
			// Toggle displays given loss end state
			$('#hangman_message_loss').css('display', 'block');
			$('#hangman_message_win').css('display', 'none');
			$('#hangman_platform').attr('src', "images/evil_hangman/platform_loss.gif");
		}
	}

	function update_view(){
		/* Requires gameState.wordLength, Empties hangman_word then repopulates
		it with LIs encapsulating as there the letters gameState.activeWord */
		// Update hangman_word
		$('#hangman_word').empty();
		for(var i = 0; i < gameState.wordLength; i++)
			$('#hangman_word').append('<li>'+gameState.activeWord[i]+'</li>');
		// Update hangman_platform
		$('#hangman_platform').attr('src', "images/evil_hangman/platform_"+gameState.chances+".gif");
		// Empty the guess box
		$('#hangman_guess_box').val('');
		// Update hangman_chances
		//console.log('update_view: gameState.chances = '+gameState.chances);
		$('#hangman_chances').html("You have <span>"+gameState.chances+"</span> chance"+(gameState.chances == 1 ? "" : "s")+" remaining.");
	}

	function gen_eq_classes(letter){
		/* Requires that gameState.words has been populated and as a parameter
		the letter guessed by the player, then iterates over all the words in
		the game state; each time calling compute_hash() with the word and the
		guessed letter and incrementing by one the value in the array,
		gameState.eqClass[], at the key equal to the returned computed hash.
		This function ultimately returns an array of counts of words that are
		indexed by an integer representation of the class (e.g. ‘34’ for ‘0100010’). */
        for(var w in gameState.words){
			var word = gameState.words[w];
			var hash = compute_hash(word, letter);
			gameState.eqClass[hash] = (gameState.eqClass[hash] > 0 ? gameState.eqClass[hash] + 1 : 1);
		}
		//console.log('gen_eq_classes: gameState.eqClass = '+gameState.eqClass);
	}

	function compute_hash(word, letter){
        /* Takes a word and a letter as parameters and returns the binary
		representation in decimal notation of the positions of that letter
		in that word. */
		var hash = 0;
        var idx = word.indexOf(letter, 0);
        while(idx >= 0){
            hash += Math.pow(2, (word.length - (idx + 1)));
            idx = word.indexOf(letter, idx + 1);
        }
		return hash;
	}

	function select_eq_class(){
        /* Compare all the values in gameState.eqClass[], and return the key to
		the highest value representing the number of members to that equivalency
		class, and in the case where there are more than one class that has tied
		for most members, then I select a class pseudo-randomly. */
        // Determine maximum value of the gameState.eqClass membership
        var s = gameState.eqClass.slice().sort(function(a, b){return b - a});
        var maxEqClassSize = s[0];
		//console.log('select_eq_class: maxEqClassSize = '+maxEqClassSize);
        // Find key for all classes with member counts equal to maximum value
        var largestClasses = [];
        var i = 0;
        for(var hash in gameState.eqClass){
            if(gameState.eqClass[hash] == maxEqClassSize){
                largestClasses[i++] = hash;
			}
        }
        // Check for ties. Return largest, or a pseudo-random choice of largest
        var len = largestClasses.length;
        return len < 2 ? largestClasses[0] : largestClasses[Math.floor((Math.random()*len)+0)];
	}

	function update_word_list(selectedHash, letter){
        /* Reduces the “active set”, represented as the array gameState.words[],
		to include only the words that when passed to compute_hash(), match the
		value returned by a call to a new function, select_eq_class(). This
		reduction is achieved by moving the matched words to the front of the
		array, then trimming remainder of the set. Finally, once
		gameState.words[] has been reduced, update_word_list() then empties
		gameState.eqClass[].*/
		var matchesFound = 0;
		for(var w in gameState.words){
			var word = gameState.words[w];
			if(compute_hash(word, letter) == selectedHash)
				gameState.words[matchesFound++] = word;
		}
		var len = gameState.words.length;
		gameState.words.splice(matchesFound, len-matchesFound);
        gameState.eqClass = [];
        //console.log('update_word_list: gameState.words.length = '+gameState.words.length);
        //var onethrufive = '';
        //for(var i = 0; i < 5; i++) onethrufive += gameState.words[i] + ', ';
        //console.log('update_word_list: gameState.words(1:5) = '+onethrufive);
	}

	function update_active_word(selectedHash, letter){
		/* Which requires two parameters, selectedHash and letter, and that
		gameState.wordLength. Calculates what the new “active word” will be by
		calling decode_hash() with the selectedHash and adding the letter to
		gameState.activeWord where there are ‘1’s in the resulting logical vector. */
		var decodedHash = decode_hash(selectedHash);
		for(var i = 0; i < gameState.wordLength; i++){
			if(decodedHash[i] == '1'){
				gameState.activeWord = gameState.activeWord.substr(0, i) + letter + gameState.activeWord.substr(i+1);
			}
		}
		//console.log('update_active_word: gameState.activeWord = '+gameState.activeWord);
	}

	function decode_hash(hash){
		/* Takes in one parameter, hash, and returns a string, the base2
		representation of the hash value, with the intention of using it as a
		logical array.*/
		var decodedHash = parseInt(hash, 10).toString(2);
		// Gaurantee that result is the same length as the "active word"
		var zeros = [];
		var lenDiff = gameState.wordLength - decodedHash.length;
		for(var i = 0; i < lenDiff; i++) zeros[i] = '0';
		return zeros.join('') + decodedHash;
	}
}

