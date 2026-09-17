const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf-8');

const s1 = `                                date: new Date().toISOString(),
                                image: certImage
                              })
                })
                          });
                      } catch (e) {`;
                      
const r1 = `                                date: new Date().toISOString(),
                                image: certImage
                              })
                          });
                      } catch (e) {`;
content = content.replace(s1, r1);
fs.writeFileSync('App.tsx', content);
