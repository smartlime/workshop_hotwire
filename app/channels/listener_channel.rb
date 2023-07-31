class ListenerChannel < ApplicationCable::Channel
  def subscribed
    return unless station.live?

    stream_from channel_name
    station.change_listeners_count_by(1)
    broadcast_listeners_count
  end

  def unsubscribed
    return unless station.live?

    stop_all_streams
    station.change_listeners_count_by(-1)
    broadcast_listeners_count
  end

  private

  def broadcast_listeners_count
    ActionCable.server.broadcast channel_name, { listeners: station.current_listeners_count }
  end

  def channel_name
    @_channel_name ||= "listeners-#{station.id}"
  end

  def station
    @_station ||= LiveStation.find(params[:station])
  end
end
