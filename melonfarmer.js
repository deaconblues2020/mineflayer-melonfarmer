/*
 *  wheat farming robot
 *  07.05.2024
 */
const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder')
const { devNull } = require('os')
const { performance } = require('perf_hooks')
const { Vec3 } = require('vec3')

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 55619,
  username: 'melonfarmer'
})

defaultMovements = null

bot.once('spawn', () => {
    bot.loadPlugin(pathfinder) // load pathfinder plugin into the bot
    defaultMovements = new Movements(bot) // create a new instance of the `Movements` class
    bot.pathfinder.setMovements(defaultMovements) // set the bot's movements to the `Movements` we just created
  })


bot.on('chat', async (username, message) => {
    if (username === bot.username) return
    const target = bot.players[username] ? bot.players[username].entity : null

    if (message.startsWith('farm')) {
      /*const name = message.split(' ')[1]
      if (bot.registry.blocksByName[name] === undefined) {
        bot.chat(`${name} is not a block name`)
        return
      }
      console.log("farm " + name);*/
      farmLoop() 
    } else  if (message.startsWith('come')) {
      if (!target) {
        bot.chat('I don\'t see you !')
        return
      }
      const p = target.position

      bot.pathfinder.setMovements(defaultMovements)
      bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 1))
    } 
  
})

bot.on('wake', () => {
    bot.chat('Good morning!')
    setTimeout(farmLoop, 1000)
  })

async function farmLoop () {
    setTimeout(harvestLoop, 1000)
}    


/*************************************************************
 *              harvest
 *************************************************************/
async function harvestLoop () {
    try {

        // mine wheat
        console.log("starting farmLoop");
        const block = bot.findBlock({ 
            matching: (block) => {
                return block && (block.type === bot.registry.blocksByName.pumpkin.id || block.type === bot.registry.blocksByName.melon.id)
              }
        })
        
        if(block) {
            bot.pathfinder.goto(new GoalNear(block.position.x, block.position.y, block.position.z, 1)).then(() => mineBlock(block));
        } else {
            console.log("nothing more to sow, time to deposit or chill out")
            /*
            const melonCount = bot.inventory.items().filter(item => item.name === "melon").length;
            const pumpkinCount = bot.inventory.items().filter(item => item.name === "pumpkin").length;
            const totalCount = melonCount + pumpkinCount;
            //const wheat = bot.inventory.items().find(item => item.name === "wheat");
            if (totalCount > 0) {
                
            } else {
              console.log("I do not have enough wheat to deposit. Sorry");
              setTimeout(gotoBed, 1000)
            }    
            //console.log("moving on to the sowing phase")
            //setTimeout(gotoBed, 1000)
            */
            setTimeout(deposit, 1000)
        }
    } catch (e) {
      console.log(e)
    }
  
}

async function mineBlock(block) {
    console.log("digging")
    await bot.dig(block)

    setTimeout(harvestLoop, 250)
}

/*************************************************************
 *              depositing in chest
 *************************************************************/
 
function deposit() {
  logInventory()
    const id = [bot.registry.blocksByName["chest"].id]
    const chestBlock = bot.findBlock({ matching: id })
  
    if (!chestBlock) {
        console.log("Chest not found. I am giving up.");
        return;
    }
    bot.pathfinder.goto(new GoalNear(chestBlock.position.x, chestBlock.position.y, chestBlock.position.z, 1)).then(() => depositInChest(chestBlock));
      
  }
  
  async function depositInChest(chestBlock) {
  
      if(bot.inventory.items().find(item => item.name === "pumkin") || bot.inventory.items().find(item => item.name === "melon_slice")) {

      let chest = await bot.openChest(chestBlock)  
      for (slot of bot.inventory.slots) {
        if(slot)
          console.log("slot name  " + slot.name);
        if (slot && slot.name == "pumpkin") {
          await chest.deposit(slot.type, null, slot.count);
          console.log("deposited " + slot.count + " pumkin units");
        } else if (slot && slot.name == "melon_slice") {
          await chest.deposit(slot.type, null, slot.count);
          console.log("deposited " + slot.count + " melon units");
        }
      }
    
      chest.close();
      setTimeout(harvestLoop, 1000)
      
    } else {
      console.log("bed time");
      setTimeout(gotoBed, 1000)
    }
}

/*************************************************************
 *     go to bed and maybe sleep
 *************************************************************/

function gotoBed() {

    let bed = bot.findBlock({
        matching: block=>bot.isABed(block),
    });

    if (!bed) {
        console.log("Couldn't find bed.");
        setTimeout(farmLoop, 1000)
    }
    bot.pathfinder.goto(new GoalNear(bed.position.x, bed.position.y, bed.position.z, 1)).then(() => goToSleep(bed));

}

async function goToSleep(bed) {
    try {
      await bot.sleep(bed) 
      bot.chat("I'm going to sleep. Nighty night.")
      console.log("I'm going to sleep. Nighty night.")
    } catch (err) {
      console.log(`I can't sleep: ${err.message}`)
      // anti-pattern - using exception handling for normal program flow
      setTimeout(farmLoop, 5000)
    }

  }


  function logInventory() {
    const inventory = bot.inventory.items();
  
    console.log("Inventory:");
  
    inventory.forEach(item => {
      console.log(`${item.name} x ${item.count}`);
    });
  }