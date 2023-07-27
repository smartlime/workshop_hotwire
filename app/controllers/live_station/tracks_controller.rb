class LiveStation::TracksController < ApplicationController
  before_action :authenticate

  def create
    station = current_user.live_station!
    track = Track.find(params[:track_id])

    station.enqueue(track)

    redirect_back fallback_location: root_path, notice: "Track #{track.title} has been added to your station's queue"
  end

  def play
    station = current_user.live_station!
    track = Track.find(params[:id])

    station.play_now(track)

    render partial: "shared/player", locals: {station:, track:}
  end

  def destroy
    station = current_user.live_station!
    track = station.tracks.find(params[:id])

    station.tracks.delete(track)

    redirect_back fallback_location: root_path, notice: "Track #{track.title} has been removed from your station's queue"
  end
end
