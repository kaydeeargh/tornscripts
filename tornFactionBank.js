// ==UserScript==
// @name         Torn City - Faction Bank
// @namespace    Goltred.Faction
// @version      0.9
// @description  Display money on faction bank and online bankers
// @author       Goltred
// @updateURL    https://raw.githubusercontent.com/Goltred/tornscripts/master/tornFactionBank.js
// @downloadURL  https://raw.githubusercontent.com/Goltred/tornscripts/master/tornFactionBank.js
// @match        https://www.torn.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

class TornAPI {
  constructor(key) {
    this.baseUrl = 'https://api.torn.com'
    this.key = key;
    this.userData = {};
  }

  async setupUserData() {
    let data = await this.user();
    if (data) {
      this.userData.name = data.name;
      this.userData.player_id = data.player_id;
    }
  }

  async faction(selections = '') {
    const targetUrl = `${this.baseUrl}/faction/?selections=${selections}&key=${this.key}`;
    return new Promise((resolve, reject) => {
      $.get(targetUrl, (data) => {
        if (data.error) reject(`Torn Faction Bank Script: Error Code: ${data.code} - ${data.error}`);
        resolve(data);
      });
    });
  }

  async user(selections = '') {
    const targetUrl = `${this.baseUrl}/user/?selections=${selections ? selections : ''}&key=${this.key}`;
    return new Promise((resolve) => {
      $.get(targetUrl, (data) => {
        if (data.error) reject(`Torn Faction Bank Script: ${data.code} - ${data.error}`);
        resolve(data);
      });
    });
  }
}

function showAPIInput() {
  const body = $('body');

  const inputBox = $(`
<div class="info-msg" id="tcfb-apibox" style="position: absolute;top: 0;right: 0;background-color: lightgray; border-style: solid; border-left: 5px solid red;">
  <p>Enter your API Key</p>
  <input type="text" id="tcfb-input-api" />
  <button id="tcfb-save-api">Save</button>
</div>`);
  body.append(inputBox);
  $('#tcfb-save-api').on('click', () => tcfb_saveAPI());
}

function tcfb_saveAPI() {
  const val = $('#tcfb-input-api').val();
  GM_setValue('apikey', val);
  $("#tcfb-apibox").css('display', 'none');
  main(val);
}

function displayFactionMoney(data, userData) {
  // Copy the money point block
  const moneyPointBlock = $('#user-money').closest('p[class^="point-block"]');
  const newPointBlock = moneyPointBlock.clone();

  // Get the label and value fields
  const spans = newPointBlock.children("span");
  const label = spans.first();
  const moneySpan = spans.last();

  // Move things inside an a element for tooltipping
  const hoverLink = $('<a href="#" id="tcbf-block"></a>');
  newPointBlock.append(hoverLink);
  hoverLink.append(spans);

  // Update the label and set the default value money
  label.text('Faction:');
  moneySpan.css('color', '');
  moneySpan.text('$0');

  if (data) {
    const { donations } = data;
    if (donations) {
      // I should have some balance
      const { money_balance } = donations[userData.player_id];

      if (money_balance) {
        // Set colors
        if (money_balance < 0) moneySpan.css('color', 'red');
        else if (money_balance > 0) moneySpan.css('color', '#678c00');

        // Set text, formatting string as money
        moneySpan.text(` $${money_balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`);
      }
    }
  }

  // Add the element to the DOM
  moneyPointBlock.after(newPointBlock);

  $("#tcbf-block").tooltip({
    open: (event, ui) => {
      console.log('opening');
    }
  });
}

function main(apiKey) {
  // Initialize torn api
  const api = new TornAPI(apiKey);
  api.user().then((userData) => {
    // Get the donations from the faction
    api.faction('donations').then((facData) => {
      displayFactionMoney(facData, userData);
    }).catch((err) => {
      console.error(err);
    });
  }).catch((err) => {
    console.error(err);
  });
}

const apiKey = GM_getValue('apikey');

if (!apiKey) {
  showAPIInput();
} else {
  main(apiKey);
}
