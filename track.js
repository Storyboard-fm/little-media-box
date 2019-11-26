const Source = require('./source')
const Timecode = require('smpte-timecode')


class Track {
  constructor(source, index = 0) {
    this.source = source
    if (this.source instanceof Source) {
      this.properties = this.source.properties.streams[index]
      this.mediaType = this.properties.codec_type || ''
    } else {
      throw new Error('Invalid source provided to new Track constructor')
    }

    // Non-primary Video tracks are most likely an embedded coverart or image
    this.primary = this.properties.disposition['default'] === 1
  }
}


class Audio extends Track {
  constructor(source, index = 0) {
    super(source, index)

    this.valid = this.mediaType === 'audio'

    if (!this.valid) {
      throw new Error(`Media track at index ${index} not a valid video`)
    }
  }
}


class Subtitle extends Track {
  constructor(source, index = 0) {
    super(source, index)

    this.valid = this.mediaType === 'subtitle'

    if (!this.valid) {
      throw new Error(`Media track at index ${index} not a valid video`)
    }
  }
}


class Video extends Track {
  constructor(source, index = 0) {
    super(source, index)

    this.valid = this.mediaType === 'video'

    if (!this.valid) {
      throw new Error(`Media track at index ${index} not a valid video`)
    }

    if (this.primary) {
      this.getSmpteTimecode()
    }
  }

  getSmpteTimecode() {
    const [num, den] = this.properties.r_frame_rate.split('/')
    const t = new Date(1970, 0, 1)
    t.setSeconds(this.properties.duration)

    return this.smpteTimecode = Timecode(t, Number((num/den).toFixed(2)), (num % den !== 0))
  }
}


module.exports = { Audio, Subtitle, Video }
