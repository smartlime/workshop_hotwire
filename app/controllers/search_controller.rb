class SearchController < ApplicationController
  def index
    q = params[:q]

    if q.blank? || q.length < 3
      unless turbo_frame_request?
        return redirect_back(fallback_location: root_path, alert: "Please, enter at least 3 characters")
      end
    else
      @artists = Artist.search(q).limit(10)
      @albums = Album.search(q).limit(10)
      @tracks = Track.search(q).limit(10)
    end

    if turbo_frame_request?
      render partial: "live_results", locals: {artists: @artists, albums: @albums, tracks: @tracks}
    end
  end
end
