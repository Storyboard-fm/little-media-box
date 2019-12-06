const Source = require('./source')
const { AudioTrack, SubtitleTrack, VideoTrack, Track } = require('./track')

const nanoprocess = require('nanoprocess')
const path = require('path')
const uuidv4 = require('uuid/v4')

class Delivery {
  constructor(sources, opts = {}) {
    if (sources instanceof Source) {
      this.sources = [sources]
    } else if (Array.isArray(sources) && sources.every(s => s instanceof Source)) {
      this.sources = sources
    } else {
      throw new Error('Invalid sources provided')
    }
    this.opts = opts
  }
}

class Package {
  constructor(tracks, opts = {}) {
    this.uuid = uuidv4()
    if (tracks instanceof Track) {
      this.tracks = [tracks]
    } else if (Array.isArray(tracks) && tracks.every(t => t instanceof Track)) {
      this.tracks = tracks.sort((track1, track2) => {
        return track1.properties.index - track2.properties.index
      })
    } else {
      throw new Error('Invalid tracks provided')
    }
    this.opts = opts

    this.muxes = []
    this.demuxes = []
  }
  mux(options = {}) {
    return new Promise((resolve, reject) => {
      const opts = options //copy
      const outputUrl = opts.outputUrl || 'mux_output.mkv'

      const tracks = this.tracks //copy
      const cmdOpts = ['-o', outputUrl, tracks.shift().source.uri]
      cmdOpts.push(
        ...tracks.filter(t => t.source.uri !== cmdOpts[2]).map(m => `+${m.source.uri}`)
      )
      const muxCmd = nanoprocess('mkvmerge', cmdOpts)

      muxCmd.open((err) => {
        if (err) { reject(err) }
        muxCmd.process.on('close', (exitCode) => {
          console.log('closed mux command with code', exitCode)
          if (exitCode == 0) {
            this.muxes.push(outputUrl)
            resolve(outputUrl)
          } else {
            reject('mkvmerge failed with exit code', exitCode)
          }
        })
      })
    })
  }
}

module.exports = { AudioTrack, Delivery, Package, Source, SubtitleTrack, Track, VideoTrack }
