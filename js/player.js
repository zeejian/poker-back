function Player(
  playerId,
  pos_id,
  name,
  avatar,
  role,
  bankroll,
  carda,
  cardb,
  status,
  total_bet,
  subtotal_bet,
  chips
) {
  this.player_id = playerId; //seating position
  this.pos_id = pos_id;
  this.name = name;
  this.avatar = avatar;
  this.role = role; // small, big, button
  this.bankroll = bankroll;
  this.carda = carda;
  this.cardb = cardb;
  this.status = status; //active: playing, inactive: seated but not playing(player who folded, new player joined in but game is already on)
  this.total_bet = total_bet; //total bet each game
  this.subtotal_bet = subtotal_bet; //bet each round
  this.chips = chips; //winning chips to collect
}

module.exports = { Player };
