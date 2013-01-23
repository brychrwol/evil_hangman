<?php
include("../scripts/connection.php");

class hangman_model{
	public static function initialize_game(){
		/* Retrieves a list of all words of a given length by calling the
		function, get_words_of_length(), then returns a array of the list of
		words retrieved, the word length, and value for the “chance allowance”. */
		//$gameState['gameId'] = time();
		$gameState['words'] = hangman_model::get_words_of_length(7);
		$gameState['wordLength'] = 7;
		$gameState['chances'] = 6;
		return json_encode($gameState);
	}

	private function get_words_of_length($wordLength){
		/* Takes in one parameter, the desired word length, then returns a JSON
		representation of an array of all the words in the database that have a
		len that matches the desired word length. */
		$mysql_resource = mysql_query("SELECT word FROM evil_hangman_words WHERE len = $wordLength");
		$key = 0;
		while($word = mysql_fetch_row($mysql_resource))
			$words[$key++] = $word[0];
		return $words;
	}

	public static function dos_wall($ip){
		/* Rrequires an IPv4 address as its only parameter and returns a
		Boolean that will indicate if a request will be honored or not. Then,
		the returned value is determined by querying the blacklist table for
		the provided address and the infraction count. If an address is found,
		and the count is at least 5, the request is denied. Next dos_wall()
		flushes all entries in the dos_wall table that have expired, i.e. rows
		that are older than 1 second. It then queries the table for the IP
		address, and if the address is found there, then the request is denied
		and the infraction is recorded (INSERT and set count to 1 if ip is not
		already on the blacklist, UPDATE and increment count if it was). If the
		request is not denied, each successful request that is allowed through
		the dos_wall() is recorded in the dos_wall table. */
		$allowed = false;
		// Check for ip in blacklist, remember infraction count, allow request if it is less than 5
		$my_resource = mysql_query("SELECT infCount FROM evil_hangman_blacklist WHERE ip = '$ip'");
		$blackList = mysql_fetch_object($my_resource);
		if($blackList->infCount < 5){
			// Delete all rows in dos_wall that have expired, i.e. are older than 1 second
			mysql_query("DELETE FROM evil_hangman_dos_wall WHERE TIMESTAMPDIFF(SECOND, dw_timestamp, CURRENT_TIMESTAMP) >= 1");
			// Check for ip in dos_wall, allow and log request if it is not found
			$my_resource = mysql_query("SELECT ip FROM evil_hangman_dos_wall WHERE ip = '$ip'");
			$dos_wall = mysql_fetch_object($my_resource);
			if($dos_wall->ip == ''){
				$allowed = true;
				mysql_query("INSERT INTO evil_hangman_dos_wall VALUES('$ip', DEFAULT)");
			}else{
				// Increase this IP's infraction count
				if($blackList->infCount != '')
					mysql_query("UPDATE evil_hangman_blacklist SET infCount = ".($blackList->infCount + 1)." WHERE ip = '$ip'");
				else mysql_query("INSERT INTO evil_hangman_blacklist VALUES ('$ip', 1)");
			}
		}
		return $allowed;
	}
}

if(isset($_GET['initialize_game']) && hangman_model::dos_wall($_SERVER['REMOTE_ADDR'])){
	echo hangman_model::initialize_game();
}
?>