import { Controller } from "@hotwired/stimulus";
import FakeAudio from "fake_audio";
import { FetchRequest } from "@rails/request.js";

function secondsToDuration(num) {
  let mins = Math.floor(num / 60);
  let secs = (num | 0) % 60;
  if (mins < 10) mins = "0" + mins;
  if (secs < 10) secs = "0" + secs;
  return `${mins}:${secs}`;
}

// Connects to data-controller="player"
export default class extends Controller {
  static targets = ["progress", "time"];
  static outlets = ["track"];
  static values = { duration: Number, track: String, nextTrackUrl: String, state: String, pauseUrl: String , resumeUrl: String };
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

  stateValueChanged() {
    if (this.pauseUrlValue) {
      return;
    }

    if (this.playing && this.stateValue === "paused") {
      this.pause(false);
    } else if (!this.playing && this.stateValue === "playing") {
      this.play(false);
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

    if (this.playing || this.stateValue === "playing") {
      this.play();
    }
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

    if (this.resumeUrlValue) this.broadcastStateChange(this.resumeUrlValue);
  }

  pause() {
    this.element.classList.remove(this.playingClass);
    this.audio.pause();
    this.playing = false;

    if (this.pauseUrlValue) this.broadcastStateChange(this.pauseUrlValue);
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

  async broadcastStateChange(url) {
    const request = new FetchRequest("POST", url, {
      responseKind: "turbo-stream",
    });
    const response = await request.perform();
    if (!response.ok) {
      console.error("Failed to broadcast pause/resume", response.status);
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
