import { Controller } from "@hotwired/stimulus";
import FakeAudio from "fake_audio";
import { useHotkeys } from "stimulus-use/hotkeys"

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
  static values = { duration: Number, track: String, nextTrackUrl: String };
  static classes = ["playing"];

  initialize() {
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.playing = false;

    useHotkeys(this, {
      'space': [this.toggle],
    })
  }

  trackValueChanged() {
    if (this.audio) {
      this.audio.removeEventListener("timeupdate", this.handleTimeUpdate);
      this.audio.removeEventListener("ended", this.handleEnded);
      this.audio.pause();
      this.updateProgress(0);
    }

    if (!this.trackValue) return;

    this.audio = new FakeAudio(this.durationValue);
    this.audio.addEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.addEventListener("ended", this.handleEnded);
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
    if (this.audio && this.playing) {
      this.play();
    }
  }

  disconnect() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  toggle() {
    this.playing ? this.pause() : this.play();
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
      Turbo.visit(this.nextTrackUrlValue, { frame: "player" });
    }
  }

  handleTimeUpdate() {
    const currentTime = this.audio.currentTime;

    this.updateProgress(currentTime);
  }

  updateProgress(currentTime) {
    const percent = (currentTime * 100) / this.durationValue;

    if (this.hasProgressTarget) this.progressTarget.style.width = `${percent}%`;
    if (this.hasTimeTarget)
      this.timeTarget.textContent = secondsToDuration(currentTime);
  }
}
