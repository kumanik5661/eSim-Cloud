import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import api from '../../utils/Api'
import {
  Hidden,
  List,
  ListItem,
  Collapse,
  ListItemIcon,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Divider

} from '@material-ui/core'
import Loader from 'react-loader-spinner'
import SearchIcon from '@material-ui/icons/Search'

import { makeStyles } from '@material-ui/core/styles'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import CloseIcon from '@material-ui/icons/Close'

import './Helper/SchematicEditor.css'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLibraries, toggleCollapse, fetchComponents, toggleSimulate } from '../../redux/actions/index'
import SideComp from './SideComp.js'
import SimulationProperties from './SimulationProperties'
const COMPONENTS_PER_ROW = 3

const useStyles = makeStyles((theme) => ({
  toolbar: {
    minHeight: '90px'
  },
  nested: {
    paddingLeft: theme.spacing(2),
    width: '100%'
  },
  head: {
    marginRight: 'auto'
  }
}))

const searchOptions = {
  NAME: 'name__icontains',
  KEYWORD: 'keyword__icontains',
  DESCRIPTION: 'description__icontains',
  COMPONENT_LIBRARY: 'component_library__library_name__icontains',
  PREFIX: 'symbol_prefix'
}

// var tempSearchTxt = ''

const searchOptionsList = ['NAME', 'KEYWORD', 'DESCRIPTION', 'COMPONENT_LIBRARY', 'PREFIX']

export default function ComponentSidebar ({ compRef }) {
  const classes = useStyles()
  const libraries = useSelector(state => state.schematicEditorReducer.libraries)
  const collapse = useSelector(state => state.schematicEditorReducer.collapse)
  const components = useSelector(state => state.schematicEditorReducer.components)
  const isSimulate = useSelector(state => state.schematicEditorReducer.isSimulate)
  const auth = useSelector(state => state.authReducer)

  const dispatch = useDispatch()
  const [isSearchedResultsEmpty, setIssearchedResultsEmpty] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [favourite, setFavourite] = useState(null)
  const [favOpen, setFavOpen] = useState(false)

  const [searchedComponentList, setSearchedComponents] = useState([])
  const [searchOption, setSearchOption] = useState('NAME')
  const [uploaded, setuploaded] = useState(false)
  const [def, setdef] = useState(false)
  const [additional, setadditional] = useState(false)

  // const searchedComponentList = React.useRef([])

  const timeoutId = React.useRef()

  const handleSearchOptionType = (evt) => {
    setSearchedComponents([])
    setSearchOption(evt.target.value)
  }

  const handleSearchText = (evt) => {
    // tempSearchTxt = evt.target.value
    if (searchText.length === 0) {
      setSearchedComponents([])
    }
    setSearchText(evt.target.value)
    setSearchedComponents([])
    // mimic the value so we can access the latest value in our API call.

    // call api from here. and set the result to searchedComponentList.
  }

  React.useEffect(() => {
    if (auth.isAuthenticated) {
      const token = localStorage.getItem('esim_token')
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      }
      if (token) {
        config.headers.Authorization = `Token ${token}`
      }
      api
        .get('favouritecomponents', config)
        .then((resp) => {
          setFavourite(resp.data.component)
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }, [auth])

  React.useEffect(() => {
    // if the user keeps typing, stop the API call!
    clearTimeout(timeoutId.current)
    // don't make an API call with no data
    if (!searchText.trim()) return
    // capture the timeoutId so we can
    // stop the call if the user keeps typing
    timeoutId.current = setTimeout(() => {
      // call api here
      setLoading(true)
      var config = {}
      const token = localStorage.getItem('esim_token')
      if (token && token !== undefined) {
        config = {
          headers: {
            Authorization: `Token ${token}`
          }
        }
      }
      api.get(`components/?${searchOptions[searchOption]}=${searchText}`, config)
        .then(
          (res) => {
            if (res.data.length === 0) {
              setIssearchedResultsEmpty(true)
            } else {
              setIssearchedResultsEmpty(false)
              setSearchedComponents([...res.data])
            }
          }
        )
        .catch((err) => { console.error(err) })
      setLoading(false)
    }, 800)
  }, [searchText, searchOption])

  const handleCollapse = (id) => {
    // Fetches Components for given library if not already fetched
    if (collapse[id] === false && components[id].length === 0) {
      dispatch(fetchComponents(id))
    }

    // Updates state of collapse to show/hide dropdown
    dispatch(toggleCollapse(id))
  }

  // For Fetching Libraries
  useEffect(() => {
    dispatch(fetchLibraries())
  }, [dispatch])

  useEffect(() => {
    if (libraries.filter((ob) => { return ob.default === true }).length !== 0) { setdef(true) } else { setdef(false) }
    if (libraries.filter((ob) => { return ob.additional === true }).length !== 0) { setadditional(true) } else { setadditional(false) }
    if (libraries.filter((ob) => { return (!ob.additional && !ob.default) }).length !== 0) { setuploaded(true) } else { setuploaded(false) }
  }, [libraries])

  // Used to chunk array
  const chunk = (array, size) => {
    return array.reduce((chunks, item, i) => {
      if (i % size === 0) {
        chunks.push([item])
      } else {
        chunks[chunks.length - 1].push(item)
      }
      return chunks
    }, [])
  }

  const libraryDropDown = (library) => {
    return (
      <div key={library.id}>
        <ListItem onClick={(e, id = library.id) => handleCollapse(id)} button divider>
          <span className={classes.head}>{library.library_name.slice(0, -4)}</span>
          {collapse[library.id] ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={collapse[library.id]} timeout={'auto'} unmountOnExit mountOnEnter exit={false}>
          <List component="div" disablePadding dense >
            {/* Chunked Components of Library */}
            { chunk(components[library.id], COMPONENTS_PER_ROW).map((componentChunk) => {
              return (
                <ListItem key={componentChunk[0].svg_path} divider>
                  { componentChunk.map((component) => {
                    return (
                      <ListItemIcon key={component.full_name}>
                        <SideComp component={component} setFavourite={setFavourite} favourite={favourite}/>
                      </ListItemIcon>
                    )
                  })}
                </ListItem>
              )
            })}
          </List>
        </Collapse>
      </div>
    )
  }

  const handleFavOpen = () => {
    setFavOpen(!favOpen)
  }

  return (
    <>
      <Hidden smDown>
        <div className={classes.toolbar} />
      </Hidden>

      <div style={isSimulate ? { display: 'none' } : {}}>
        {/* Display List of categorized components */}
        <List>
          <ListItem button>
            <h2 style={{ margin: '5px' }}>Components List</h2>
          </ListItem>
          <ListItem>

            <TextField
              id="standard-number"
              placeholder="Search Component"
              variant="outlined"
              size="small"
              value={searchText}
              onChange={handleSearchText}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />

          </ListItem>

          <ListItem divider>
            <TextField
              style={{ width: '100%' }}
              id="searchType"
              size='small'
              variant="outlined"
              select
              label="Search By"
              value={searchOption}
              onChange={handleSearchOptionType}
              SelectProps={{
                native: true
              }}
            >

              {
                searchOptionsList.map((value, i) => {
                  return (<option key={i} value={value}>
                    {value}
                  </option>)
                })
              }

            </TextField>
          </ListItem>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }} >
            {searchText.length !== 0 && searchedComponentList.length !== 0 &&

              searchedComponentList.map((component, i) => {
                return (<ListItemIcon key={i}>
                  <SideComp component={component} />
                </ListItemIcon>)
              }
              )

            }

            <ListItem>

              <Loader
                type="TailSpin"
                color="#F44336"
                height={100}
                width={100}
                visible={loading}
              />
            </ListItem>

            {!loading && searchText.length !== 0 && isSearchedResultsEmpty &&

              <span style={{ margin: '20px' }}>No Components Found</span>

            }

            {/* Collapsing List Mapped by Libraries fetched by the API */}
            {favourite && favourite.length > 0 &&
              <>
                <ListItem button onClick={handleFavOpen} divider>
                  <span className={classes.head}>Favourite Components</span>
                  <div>
                    {favOpen ? <ExpandLess /> : <ExpandMore />}
                  </div>
                </ListItem>
                <Collapse in={favOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItem>
                      <div style={{ marginLeft: '-30px' }}>
                        {chunk(favourite, 3).map((componentChunk) => {
                          return (
                            <div key={componentChunk[0].svg_path}>
                              <ListItem key={componentChunk[0].svg_path} divider>
                                {
                                  componentChunk.map((component) => {
                                    return (
                                      <ListItemIcon key={component.full_name}>
                                        <SideComp isFavourite={true} favourite={favourite} setFavourite={setFavourite} component={component} />
                                      </ListItemIcon>
                                    )
                                  }
                                  )
                                }
                              </ListItem>
                            </div>
                          )
                        })}
                      </div>
                    </ListItem>
                  </List>
                </Collapse>
              </>
            }
            {searchText.length === 0 &&
            <>
              <div style={!def ? { display: 'none' } : {}}>
                <Divider />
                <ListItem dense divider style={{ backgroundColor: '#e8e8e8' }}>
                  <span>DEFAULT</span>
                </ListItem>
                <Divider />
                { libraries.sort(function (a, b) {
                  var textA = a.library_name.toUpperCase()
                  var textB = b.library_name.toUpperCase()
                  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
                }).filter((library) => {
                  if (library.default) { return 1 }
                  return 0
                }).map(
                  (library) => {
                    return (libraryDropDown(library))
                  }
                )}
              </div>
              <div style={!additional ? { display: 'none' } : {}}>
                <ListItem dense divider style={{ backgroundColor: '#e8e8e8' }}>
                  <span className={classes.head}>ADDITIONAL</span>
                </ListItem>
                { libraries.sort(function (a, b) {
                  var textA = a.library_name.toUpperCase()
                  var textB = b.library_name.toUpperCase()
                  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
                }).filter((library) => {
                  if (library.additional) { return 1 }
                  return 0
                }).map(
                  (library) => {
                    return (libraryDropDown(library))
                  }
                )}
              </div>
              <div style={!uploaded ? { display: 'none' } : {}}>
                <ListItem dense divider style={{ backgroundColor: '#e8e8e8' }}>
                  <span className={classes.head}>UPLOADED</span>
                </ListItem>
                { libraries.sort(function (a, b) {
                  var textA = a.library_name.toUpperCase()
                  var textB = b.library_name.toUpperCase()
                  return (textA < textB) ? -1 : (textA > textB) ? 1 : 0
                }).filter((library) => {
                  if (!library.default && !library.additional) { return 1 }
                  return 0
                }).map(
                  (library) => {
                    return (libraryDropDown(library))
                  }
                )}
              </div>
            </>
            }
          </div>
        </List>
      </div>
      <div style={isSimulate ? {} : { display: 'none' }}>
        {/* Display simulation modes parameters on left side pane */}
        <List>
          <ListItem button divider>
            <h2 style={{ margin: '5px auto 5px 5px' }}>Simulation Modes</h2>
            <Tooltip title="close">
              <IconButton color="inherit" className={classes.tools} size="small" onClick={() => { dispatch(toggleSimulate()) }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ListItem>
          <SimulationProperties />
        </List>
      </div>
    </>
  )
}

ComponentSidebar.propTypes = {
  compRef: PropTypes.object.isRequired
}
