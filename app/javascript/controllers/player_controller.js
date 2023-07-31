import { Controller } from "@hotwired/stimulus";
import FakeAudio from "fake_audio";
import { FetchRequest } from "@rails/request.js";
import consumer from "../channels/consumer"

function secondsToDuration(num) {
  let mins = Math.floor(num / 60);
  let secs = (num | 0) % 60;
  if (mins < 10) mins = "0" + mins;
  if (secs < 10) secs = "0" + secs;
  return `${mins}:${secs}`;
}

// Connects to data-controller="player"
export default class extends Controller {
  static targets = ["progress", "time", "listeners"];
  static outlets = ["track"];
  static values = { duration: Number, track: String, nextTrackUrl: String, station: Number };
  static classes = ["playing"];

  initialize() {
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.playing = false;
  }

  trackValueChanged() {
    this.disposeAudio();
    if (!this.trackValue) return;

    this.audio = new FakeAudio(this.durationValue);
    this.setupAudioListeners();
    this.play();

    for (let outlet of this.trackOutlets) {
      outlet.togglePlayingIfMatch(this.trackValue);
    }
  }

  trackOutletConnected(outlet, el) {
    outlet.togglePlayingIfMatch(this.trackValue);
  }

  connect() {
    // Permanent element was re-attached to DOM
    if (this.audio) {
      this.setupAudioListeners();
    }

    if (this.playing) {
      this.play();
    }

    if (this.hasStationValue) {
      this.subscribeListenersCount();
    }
  }

  subscribeListenersCount() {
    this.channel = consumer.subscriptions.create(
      { channel: "ListenerChannel", station: 1 },
      { station: this.stationValue,
        received: (data) => {
          if (this.hasListenersTarget) {
            this.listenersTarget.textContent = data.listeners;
          }
        }
    });
  }

  disconnect() {
    if (this.audio) {
      this.removeAudioListeners();
    }
  }

  play() {
    this.element.classList.add(this.playingClass);
    this.audio.play();
    this.playing = true;
  }

  pause() {
    this.element.classList.remove(this.playingClass);
    this.audio.pause();
    this.playing = false;
  }

  seek(e) {
    const position =
      (e.offsetX / e.currentTarget.offsetWidth) * this.durationValue;
    this.audio.fastSeek(position);
  }

  handleEnded() {
    this.pause();

    if (this.nextTrackUrlValue) {
      this.fetchNextTrack(this.nextTrackUrlValue);
    }
  }

  handleTimeUpdate() {
    const currentTime = this.audio.currentTime;

    this.updateProgress(currentTime);
  }

  async fetchNextTrack(url) {
    const request = new FetchRequest("POST", url, {
      responseKind: "turbo-stream",
    });
    const response = await request.perform();
    if (!response.ok) {
      console.error("Failed to load next track", response.status);
    }
  }

  updateProgress(currentTime) {
    const percent = (currentTime * 100) / this.durationValue;

    if (this.hasProgressTarget) this.progressTarget.style.width = `${percent}%`;
    if (this.hasTimeTarget)
      this.timeTarget.textContent = secondsToDuration(currentTime);
  }

  disposeAudio() {
    if (!this.audio) return;

    this.removeAudioListeners();
    this.pause();
    this.updateProgress(0);

    delete this.audio;
  }

  setupAudioListeners() {
    this.audio.addEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.addEventListener("ended", this.handleEnded);
  }

  removeAudioListeners() {
    this.audio.removeEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.removeEventListener("ended", this.handleEnded);
  }
}
