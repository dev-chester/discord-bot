const axios = require('axios');
const fs = require('fs');

const { EmbedBuilder } = require('discord.js');

async function downloadFile(fileId, destinationPath) {
  // Construct the direct download URL
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  try {
    // Send a GET request with responseType as 'stream'
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    
    // Create a writable stream to save the file
    const writer = fs.createWriteStream(destinationPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

function getYearWeekPH(date = new Date()) {
  const phDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const currentDate = new Date(phDate.getTime());
  const dayNumber = (currentDate.getDay() + 6) % 7;
  currentDate.setDate(currentDate.getDate() - dayNumber + 3);
  const firstThursday = new Date(currentDate.getFullYear(), 0, 4);
  const phFirstThursday = new Date(firstThursday.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const firstDayNumber = (phFirstThursday.getDay() + 6) % 7;
  phFirstThursday.setDate(phFirstThursday.getDate() - firstDayNumber + 3);
  const diffMilliseconds = currentDate - phFirstThursday;
  const weekNumber = 1 + Math.floor(diffMilliseconds / (7 * 24 * 3600 * 1000));
  return { year: currentDate.getFullYear(), week: weekNumber };
}

function formatPace(secondsPerKm, hasUnit = true) {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  if (!hasUnit) {
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} min/km`;
}

function formatPaceRange(baseSeconds, tolerance) {
  const lower = baseSeconds - tolerance;
  const upper = baseSeconds + tolerance;
  return `${formatPace(lower, false)} - ${formatPace(upper)}`;
}

function convertTimeToSeconds(time) {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function calculateVDOT(raceTime, distanceKm) {
  // Convert race time (HH:MM:SS) to total seconds
  const totalSeconds = convertTimeToSeconds(raceTime);

  const factor1 = 200; // Derived so that for 21.1 km and 8640 sec, VDOT ≈ 29.3
  const showVdot = factor1 * (distanceKm * 60 / totalSeconds);


  const factor = 4.293;
  const vdot = totalSeconds * factor / (distanceKm * 60); 
  return {vdot, showVdot};
}

function calculateTrainingPaces(vdot, distance, time, showVdot) {
  const factor = 4.35; // derived from your half marathon parameters
  const baselineRacePace = (vdot * 60) / factor; // seconds per km

  const intensityMultipliers = {
    Easy: 1.16,  
    Marathon: 1.09,  
    Tempo: 1.00,  
    Intervals: 0.83,  
    Reps: 0.79   
  };

  const paces = {};
  for (const [key, multiplier] of Object.entries(intensityMultipliers)) {
    const paceInSeconds = baselineRacePace * multiplier;
    paces[key] = formatPaceRange(paceInSeconds, 5);
  }
  return {vdot: showVdot.toFixed(1), ...paces, 
    vdotMeaning: "VDOT is a score that represents your current running fitness level. https://www.runnersworld.com/training/a20829461/your-vdot-training-number/",
    easyMeaning: "Easy pace is a comfortable pace that allows you to hold a conversation while running.",
    marathonMeaning: "Marathon pace is the pace you can sustain for a marathon distance.",
    tempoMeaning: "Tempo pace is a comfortably hard pace that you can sustain for about an hour.",
    intervalsMeaning: "Intervals pace is the pace you can sustain for minutes of hard running with short recoveries.",
    repsMeaning: "Reps pace is the pace you can sustain for short, fast repetitions.",
    distance: distance, time: time};
}


function createPacesEmbed(result) {
  const embed = new EmbedBuilder()
    .setTitle('Your Training Paces')
    .setDescription(`${result.distance} | ${result.time}`)
    .setColor(0x0099ff)
    .addFields(
      { name: 'VDOT', value: result.vdot, inline: true },
      { name: 'Easy', value: result.Easy, inline: true },
      { name: 'Marathon', value: result.Marathon, inline: true },
      { name: 'Tempo', value: result.Tempo, inline: true },
      { name: 'Intervals', value: result.Intervals, inline: true },
      { name: 'Reps', value: result.Reps, inline: true },
      { name: 'What is VDOT', value: result.vdotMeaning, inline: true },
      { name: 'Easy Pace', value: result.easyMeaning, inline: true },
      { name: 'Marathon Pace', value: result.marathonMeaning, inline: true },
      { name: 'Tempo Pace', value: result.tempoMeaning, inline: true },
      { name: 'Intervals Pace', value: result.intervalsMeaning, inline: true },
      { name: 'Reps Pace', value: result.repsMeaning, inline: true }
    )
    .setFooter({ text: 'Training paces based on your VDOT' })
    .setTimestamp();

  return embed;
}


module.exports = { downloadFile, getYearWeekPH, 
  convertTimeToSeconds, calculateVDOT,
calculateTrainingPaces, createPacesEmbed };
