import { h, app } from 'hyperapp'
import Layout from 'components/layout'
import { isPlainObject } from 'components/internal/fixture'
import './style.less'

const state = {
  mapVisible: false,
  fields: {
    address: '',
    point: {
      // lng,
      // lat
    },
  },
  searchInput: null, /* HTMLInputElement */
  searchInputVisible: false,
  dataSource: [], /* Uesd to display on screen  */
  suggestionVisible: false,

  spot: {
    address: '',
    point: {
      // lng,
      // lat
    },
    dataSource: [], /* Uesd to store data provieded by the spot  */
  }, /* location */

  map: null,
  marker: null, /* spot */
  localSearch: null,
  geolocation: new BMap.Geolocation(),
  geocoder: new BMap.Geocoder(),
}

const actions = {
  /* state mutation */
  setState (state) {
    if (!isPlainObject(state)) {
      throw new Error(`Error: Expected a plain object, got \`${Object.prototype.toString.call(state)}\``)
    }

    return state
  },

  getState () {
    return function (state) {
      return state
    }
  },

  /* Nested Object */
  fields: {
    setField (state) {
      if (!isPlainObject(state)) {
        throw new Error(`Error: Expected a plain object, got \`${Object.prototype.toString.call(state)}\``)
      }

      return state
    }
  },

  spot: {
    setSpot (state) {
      if (!isPlainObject(state)) {
        throw new Error(`Error: Expected a plain object, got \`${Object.prototype.toString.call(state)}\``)
      }

      return state
    }
  },

  /* effects */
  refSearchInput (element) {
    return function (state, { setState }) {
      setState({ searchInput: element })
    }
  },

  showSuggestions () {
    return function (state, { setState }) {
      setState({ suggestionVisible: true })
    }
  },

  setupBaiduMap () {
    return function ({ geolocation, geocoder } , { getState, setState, fields: { setField }, spot: { setSpot }, drawSpot }) {
      const map = new BMap.Map('hym-map-suggestion_id')

      map.disableScrollWheelZoom()
      map.disableDoubleClickZoom()
      map.disableDoubleClickZoom()
      map.disableContinuousZoom()
      map.disablePinchToZoom()
      map.disableInertialDragging()

      geolocation.enableSDKLocation()
      geolocation.getCurrentPosition(
        function ({ point }){
          if(geolocation.getStatus() === BMAP_STATUS_SUCCESS){
            console.log('getCurrentPosition', point)

            map.centerAndZoom(point, 18 /* 3 ~ 18 */)
            drawSpot({
              point: point,
              callback ({ address, point, surroundingPois }) {
                setState({ dataSource: surroundingPois })
                setField({ address: address, point: point })
                setSpot({ address: address, point: point, dataSource: surroundingPois })
              }
            })
          }
        },
        { enableHighAccuracy: true }
      )

      map.addEventListener('touchstart', function ({ type, point }) {
        console.log('map touchstart', { type, point })
        const { marker } = getState()

        if (marker && !marker._touchSpot) {
          marker._touchSpot = { point: point, position: marker.getPosition() }
        }
      })

      map.addEventListener('touchmove', function ({ type, point, overlay }) {
        console.log('map touchmove', { type, point, overlay })

        if (overlay) {
          return
        }

        const { marker } = getState()

        if (marker && marker._touchSpot) {
          const { point: oldPoint, position: oldPosition } = marker._touchSpot

          marker.setPosition(
            new BMap.Point( oldPosition.lng + (oldPoint.lng - point.lng), oldPosition.lat + (oldPoint.lat - point.lat) )
          )
        }
      })

      map.addEventListener('touchend', function ({ type, point }) {
        console.log('map touchend', { type, point })

        const { marker } = getState()
        if (marker) {
          marker._touchSpot = null

          drawSpot({
            point: marker.getPosition(),
            callback ({ address, point, surroundingPois }) {
              setState({ dataSource: surroundingPois })
              setSpot({ address: address, point: point, dataSource: surroundingPois })
            }
          })
        }
      })

      setState({ map: map })
    }
  },

  handleSearch (event) {
    return function ({ map, localSearch }, { setState }) {
      if (!localSearch) {
        const localSearch = new BMap.LocalSearch(
          map,
          {
            onSearchComplete (localResult) {
              setState({ dataSource: localResult ? localResult.Ar  /* Abbreviation */ : [], })
            }
          }
        )

        localSearch.search(event.target.value)

        return setState({ localSearch: localSearch })
      }

      localSearch.search(event.target.value)
    }
  },

  handleSelectSuggestion (source) {
    return function ({ searchInput }, { setState, fields: { setField }, spot: { setSpot }, drawSpot }) {
      drawSpot({
        point: source.point,
        callback ({ address, point, surroundingPois }) {
          searchInput.value = address
          setState({ dataSource: surroundingPois, searchInputVisible: false, suggestionVisible: false, })
          setSpot({ address: address, point: point })
        }
      })
    }
  },

  cancelSuggestion () {
    return function ({ suggestionVisible, searchInput, spot }, { setState }) {
      if (suggestionVisible === false) {
        return setState({ mapVisible: false })
      }

      // Clear HTMLInputElement value
      searchInput.value = ''
      setState({ dataSource: spot.dataSource, suggestionVisible: false, })
    }
  },

  drawSpot ({ point, callback }) {
    return function ({ map, marker, geocoder, }, { setState, spot: { setSpot } }) {
      geocoder.getLocation(
        new BMap.Point(point.lng, point.lat),
        function ({ point, address, surroundingPois }) {
          console.log('getLocation', { address, point, surroundingPois })

          if (marker) {
            marker.setPosition(point)
          } else {
            map.addOverlay(marker = new BMap.Marker(point, { enableDragging: false, enableClicking: false }))
            setState({ marker: marker })
          }

          map.setCenter(point)
          typeof callback === 'function' && callback({ address, point, surroundingPois })
        }
      )
    }
  },

  transitionToMap () {
    return function ({ fields, searchInput, spot }, { setState, drawSpot }) {
      if(fields.address) {
        // Clear HTMLInputElement value
        searchInput.value = ''

        return setState({ mapVisible: true, searchInputVisible: true, suggestionVisible: false })
      }

      setState({ mapVisible: false, searchInputVisible: true, suggestionVisible: true })
    }
  },

  handleConfirmSpot () {
    return function ({ spot }, { setState, fields: { setField } }) {
      setState({ mapVisible: false })
      setField({ address: spot.address, point: spot.point })
    }
  },
}

function view (
  { mapVisible, searchInputVisible, suggestionVisible, fields, spot, dataSource },
  {
    fields: { setField }, refSearchInput, showSuggestions, setupBaiduMap,
    transitionToMap, handleSearch, handleSelectSuggestion, cancelSuggestion, handleConfirmSpot
  }
) {
  return (
    <Layout oncreate={setupBaiduMap}>

      <form class="hym-form">
        <div class="hym-form_group">
          <div class="hym-form_group-bd">
            <label class="hym-form_item" onclick={transitionToMap}>
              <div class="hym-form_item-bd">
                <input
                  type="text"
                  class="hym-form_input"
                  placeholder="你在哪儿上车"
                  autocomplete="off"
                  value={fields.address}
                  readonly={true}
                />
              </div>
            </label>
          </div>
        </div>
      </form>

      <div class={`hym-map_page ${mapVisible && '-visible'}`}>
        <div class="hym-map-suggestion">
          <div class="hym-map-suggestion_header" style={{ display: searchInputVisible ? '' : 'none' }}>
            <div class="hym-map-suggestion_address-field">
              <input
                id="mapInput"
                class="hym-form_input"
                type="text"
                placeholder="地点定位"
                oncreate={refSearchInput}
                onfocus={showSuggestions}
                oninput={handleSearch}
              />
            </div>
            <a class="hym-map-suggestion_cancel" href="javascript:void(0)" onclick={cancelSuggestion}>取消</a>
          </div>
          <div class="hym-map-suggestion_map">
            <div id="hym-map-suggestion_id" style={{ width: '100%', height: '100%' }}></div>
            <div class="hym-map-suggestion_marker" style={{ display: !suggestionVisible ? 'block' : 'none' }}>
              <div class="hym-map-suggestion_prompt" onclick={handleConfirmSpot}>
                <div class="hym-map-suggestion_prompt-address">{spot && spot.address ? spot.address : '未知位置'}</div>
                <div class="hym-map-suggestion_prompt-action">确定</div>
              </div>
            </div>
          </div>
          <div class="hym-map-suggestion_list" style={{ display: suggestionVisible ? 'block' : 'none' }}>
            <div class="-scrollable">
              {
                dataSource.length
                  ?
                    dataSource
                      .map(
                        source =>
                          <a
                            key={source.uid}
                            class="hym-map-suggestion_item"
                            href="javascript:void(0);"
                            onclick={() => handleSelectSuggestion(source)}
                          >
                            <div class="hym-map-suggestion_title">{source.title}</div>
                            <div class="hym-map-suggestion_address">{source.address}</div>
                          </a>
                      )
                  :
                    <div class="hym-map-suggestion_empty">
                      <div class="hym-map-suggestion_empty-icon"><i class="weui-icon-warn" /></div>
                      <div class="hym-map-suggestion_empty-desc">暂无结果，换个词试试吧~</div>
                    </div>
              }
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

app(state, actions, view, document.querySelector('#app'))
